type InvoiceTemplateId = "classic" | "linen" | "slate";

type InvoicePayload = {
  invoice: {
    status?: string;
    currency?: string;
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string;
    clientName?: string;
    clientEmail?: string;
    clientAddress?: string;
    invoiceNumber?: string;
    issueDate?: string;
    serviceDate?: string;
    dueDate?: string;
    paidDate?: string;
    notes?: string;
    showNotes?: boolean;
    paymentDetails?: string;
    showPaymentDetails?: boolean;
    paymentReference?: string;
    signatureName?: string;
    signatureTitle?: string;
    signatureDataUrl?: string;
    showSignature?: boolean;
    template?: InvoiceTemplateId;
    taxRate?: number;
  };
  items: {
    description?: string;
    quantity?: number;
    rate?: number;
  }[];
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeText = (value?: string) => (value ? escapeHtml(value) : "");
const safeMultiline = (value?: string) =>
  safeText(value).replaceAll(/\r\n|\n|\r/g, "<br />");

const formatMoney = (value: number, currency?: string) => {
  const safeCurrency = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
    }).format(value);
  } catch {
    return `${safeCurrency} ${value.toFixed(2)}`;
  }
};

const templateStyles: Record<
  InvoiceTemplateId,
  { accent: string; label: string; border: string }
> = {
  classic: {
    accent: "#0f0b07",
    label: "#6b7280",
    border: "#e7e2d6",
  },
  linen: {
    accent: "#f59e0b",
    label: "#b45309",
    border: "#f3e3c4",
  },
  slate: {
    accent: "#334155",
    label: "#64748b",
    border: "#e2e8f0",
  },
};

export const buildInvoiceHtml = ({ invoice, items }: InvoicePayload) => {
  const template =
    templateStyles[(invoice.template as InvoiceTemplateId) || "classic"];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const taxRate = Number(invoice.taxRate ?? 0) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const showPaymentDetails = invoice.showPaymentDetails !== false;
  const showSignature = invoice.showSignature !== false;
  const showNotes =
    invoice.showNotes !== false && Boolean(invoice.notes?.trim());

  const rows = items
    .map((item) => {
      const lineTotal = (item.quantity || 0) * (item.rate || 0);
      return `
        <tr>
          <td>${safeText(item.description || "")}</td>
          <td class="right">x${item.quantity ?? 0}</td>
          <td class="right">${formatMoney(lineTotal, invoice.currency)}</td>
        </tr>
      `;
    })
    .join("");

  const signatureBlock = showSignature
    ? `
      <div class="signature">
        <div class="section-label">Authorized signature</div>
        ${
          invoice.signatureDataUrl
            ? `<img src="${invoice.signatureDataUrl}" alt="Signature" />`
            : `<div class="signature-line"></div>`
        }
        <div class="sig-name">${safeText(invoice.signatureName || "")}</div>
        <div class="sig-title">${safeText(invoice.signatureTitle || "")}</div>
      </div>
    `
    : "";

  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice ${safeText(invoice.invoiceNumber || "")}</title>
      <style>
        :root {
          --accent: ${template.accent};
          --label: ${template.label};
          --border: ${template.border};
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #15110d;
          background: #fffdf8;
        }
        .page {
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          margin: 8px 0 0;
        }
        .label {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          color: var(--label);
        }
        .badge {
          border: 1px solid var(--border);
          color: var(--label);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          border-bottom: 1px solid var(--border);
          padding: 16px 0;
        }
        .section-title {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--label);
        }
        .name {
          font-size: 18px;
          font-weight: 600;
          margin-top: 8px;
        }
        .muted {
          color: #6b7280;
          line-height: 1.6;
          font-size: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        td {
          padding: 8px 0;
          font-size: 13px;
        }
        tr + tr td {
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }
        td.right {
          text-align: right;
        }
        .totals {
          border-top: 1px solid var(--border);
          margin-top: 16px;
          padding-top: 12px;
          font-size: 14px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: #6b7280;
        }
        .totals-row strong {
          color: #111827;
        }
        .section {
          border-top: 1px solid var(--border);
          margin-top: 16px;
          padding-top: 12px;
          font-size: 13px;
          color: #4b5563;
        }
        .section-label {
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 11px;
          color: var(--label);
          margin-bottom: 6px;
        }
        .signature {
          margin-top: 18px;
        }
        .signature img {
          height: 60px;
          object-fit: contain;
          display: block;
        }
        .signature-line {
          width: 180px;
          border-bottom: 1px solid #9ca3af;
          height: 24px;
          margin-bottom: 8px;
        }
        .sig-name {
          font-weight: 600;
          color: #111827;
          margin-top: 8px;
        }
        .sig-title {
          font-size: 11px;
          color: var(--label);
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <div class="label">Invoice</div>
            <div class="title">${safeText(invoice.invoiceNumber || "")}</div>
            <div class="muted">Issue date: ${safeText(invoice.issueDate || "")}</div>
            <div class="muted">Service date: ${safeText(invoice.serviceDate || "")}</div>
            <div class="muted">Due date: ${safeText(invoice.dueDate || "")}</div>
            ${
              invoice.status === "Paid"
                ? `<div class="muted">Paid on: ${safeText(
                    invoice.paidDate || ""
                  )}</div>`
                : ""
            }
          </div>
          <div class="badge">${safeText(invoice.status || "Draft")}</div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">From</div>
            <div class="name">${safeText(invoice.businessName || "")}</div>
            <div class="muted">
              ${safeMultiline(invoice.businessAddress || "")}<br />
              ${safeText(invoice.businessEmail || "")}<br />
              ${safeText(invoice.businessPhone || "")}
            </div>
          </div>
          <div>
            <div class="section-title">Bill To</div>
            <div class="name">${safeText(invoice.clientName || "")}</div>
            <div class="muted">
              ${safeText(invoice.clientEmail || "")}<br />
              ${safeMultiline(invoice.clientAddress || "")}
            </div>
          </div>
        </div>

        <table>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatMoney(subtotal, invoice.currency)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (${taxRate}%)</span>
            <span>${formatMoney(taxAmount, invoice.currency)}</span>
          </div>
          <div class="totals-row">
            <strong>Total</strong>
            <strong>${formatMoney(total, invoice.currency)}</strong>
          </div>
        </div>

        ${
          showPaymentDetails && invoice.paymentDetails
            ? `<div class="section">
                <div class="section-label">Payment details</div>
                <div>${safeMultiline(invoice.paymentDetails)}</div>
              </div>`
            : ""
        }
        ${
          invoice.paymentReference
            ? `<div class="section">
                <div class="section-label">Payment reference</div>
                <div>${safeText(invoice.paymentReference)}</div>
              </div>`
            : ""
        }
        ${
          showNotes
            ? `<div class="section">
                <div class="section-label">Notes</div>
                <div>${safeMultiline(invoice.notes || "")}</div>
              </div>`
            : ""
        }
        ${signatureBlock}
      </div>
    </body>
  </html>
  `;
};

export type { InvoicePayload };
