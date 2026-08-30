import type { ReactNode } from "react";
import {
  computeInvoiceTotals,
  formatBankDetails,
  formatMoney,
  getInvoiceTemplate,
  type InvoiceDraft,
  type InvoiceItem,
} from "@/lib/invoice-data";

type InvoicePreviewProps = {
  invoice: InvoiceDraft;
  items: InvoiceItem[];
  className?: string;
};

type PreviewContext = {
  invoice: InvoiceDraft;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  template: ReturnType<typeof getInvoiceTemplate>;
};

const joinBlock = (...parts: string[]) => parts.filter(Boolean).join(" • ");

const splitLines = (value?: string) =>
  (value || "")
    .split(/\r\n|\n|\r/g)
    .map((line) => line.trim())
    .filter(Boolean);

function Label({
  color,
  children,
  className = "",
}: {
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.62rem] uppercase tracking-[0.3em] font-semibold ${className}`}
      style={{ color }}
    >
      {children}
    </p>
  );
}

function PartyBlock({
  label,
  name,
  lines,
  tin,
  template,
  editorial = false,
}: {
  label: string;
  name?: string;
  lines: string[];
  tin?: string;
  template: PreviewContext["template"];
  editorial?: boolean;
}) {
  return (
    <div>
      <Label color={template.labelTone}>{label}</Label>
      <p
        className={`mt-3 break-words text-lg leading-tight ${
          editorial ? "font-serif font-bold" : "font-bold"
        } ${template.previewHeadingClass}`}
      >
        {name || "-"}
      </p>
      {tin ? (
        <p className={`mt-1 text-xs font-mono font-medium ${template.previewBodyClass}`}>
          TIN: {tin}
        </p>
      ) : null}
      <div className={`mt-2 space-y-0.5 text-sm leading-relaxed ${template.previewBodyClass}`}>
        {lines.length ? lines.map((line) => <p key={`${label}-${line}`}>{line}</p>) : <p>-</p>}
      </div>
    </div>
  );
}

function LineItemTable({
  ctx,
  strongHeader = false,
  compact = false,
  openRows = false,
}: {
  ctx: PreviewContext;
  strongHeader?: boolean;
  compact?: boolean;
  openRows?: boolean;
}) {
  const { template, items, invoice } = ctx;

  return (
    <section className={compact ? "py-4" : "py-6"}>
      <div
        className={`grid grid-cols-[1.5fr_0.55fr_0.75fr_0.8fr] gap-4 pb-2.5 ${
          strongHeader ? "border-y border-stone-200 py-2.5 px-3" : "border-b border-stone-200"
        }`}
        style={strongHeader ? { backgroundColor: template.accentSoft } : undefined}
      >
        <Label color={template.labelTone}>Description</Label>
        <Label color={template.labelTone} className="text-right">
          Qty
        </Label>
        <Label color={template.labelTone} className="text-right">
          Rate
        </Label>
        <Label color={template.labelTone} className="text-right">
          Amount
        </Label>
      </div>

      <div className={openRows ? "space-y-3 pt-3" : "divide-y divide-stone-200/80"}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid grid-cols-[1.5fr_0.55fr_0.75fr_0.8fr] gap-4 ${
              openRows ? "" : "py-3"
            }`}
          >
            <p className={`text-sm leading-relaxed font-medium ${template.previewHeadingClass}`}>
              {item.description}
            </p>
            <p className={`text-right text-sm ${template.previewBodyClass}`}>
              {item.quantity}
            </p>
            <p className={`text-right text-sm ${template.previewBodyClass}`}>
              {formatMoney(item.rate, invoice.currency)}
            </p>
            <p className={`text-right text-sm font-semibold ${template.previewHeadingClass}`}>
              {formatMoney(item.quantity * item.rate, invoice.currency)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportSections({
  ctx,
  compact = false,
  signatureOnTop = false,
}: {
  ctx: PreviewContext;
  compact?: boolean;
  signatureOnTop?: boolean;
}) {
  const { invoice, template } = ctx;
  const bankText = formatBankDetails(invoice);

  const blocks = [
    invoice.showPaymentDetails && bankText?.trim()
      ? {
          key: "payment",
          title: "Bank & Payment Details",
          content: bankText,
        }
      : null,
    (invoice.paymentReference || "").trim()
      ? {
          key: "reference",
          title: "Payment Reference",
          content: invoice.paymentReference,
        }
      : null,
    invoice.showNotes && invoice.notes?.trim()
      ? {
          key: "notes",
          title: "Notes & Terms",
          content: invoice.notes,
        }
      : null,
  ].filter(Boolean) as { key: string; title: string; content: string }[];

  const signatureBlock = invoice.showSignature ? (
    <div key="signature" className={signatureOnTop ? "" : "pt-1"}>
      <Label color={template.labelTone}>Authorized Signature</Label>
      <div className="mt-3 flex flex-col items-start">
        {invoice.signatureDataUrl ? (
          <img
            src={invoice.signatureDataUrl}
            alt="Signature"
            className="h-12 w-auto object-contain"
          />
        ) : (
          <div className="h-8 w-32 border-b border-stone-400" />
        )}
        <p
          className={`mt-2 text-sm ${
            template.id === "editorial" ? "font-serif text-base font-bold" : "font-bold"
          } ${template.previewHeadingClass}`}
        >
          {invoice.signatureName}
        </p>
        <p className={`text-[10px] uppercase tracking-widest font-medium ${template.previewBodyClass}`}>
          {invoice.signatureTitle}
        </p>
      </div>
    </div>
  ) : null;

  const contentBlocks = blocks.map((block) => (
    <div key={block.key}>
      <Label color={template.labelTone}>{block.title}</Label>
      <p
        className={`mt-2 whitespace-pre-line text-xs leading-relaxed font-medium ${template.previewBodyClass}`}
      >
        {block.content}
      </p>
    </div>
  ));

  const orderedBlocks = signatureOnTop
    ? [signatureBlock, ...contentBlocks]
    : [...contentBlocks, signatureBlock];

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {orderedBlocks.filter(Boolean)}
    </div>
  );
}

function SummaryBlock({
  ctx,
  large = false,
  heading = "Summary",
}: {
  ctx: PreviewContext;
  large?: boolean;
  heading?: string;
}) {
  const { template, subtotal, taxAmount, total, invoice } = ctx;

  return (
    <div className="space-y-3">
      <Label color={template.labelTone}>{heading}</Label>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className={template.previewBodyClass}>Subtotal</span>
          <span className={`font-medium ${template.previewHeadingClass}`}>
            {formatMoney(subtotal, invoice.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={template.previewBodyClass}>
            VAT ({invoice.taxRate}%)
          </span>
          <span className={`font-medium ${template.previewHeadingClass}`}>
            {formatMoney(taxAmount, invoice.currency)}
          </span>
        </div>
      </div>
      <div className="border-t border-stone-200 pt-3">
        <p
          className={`${large ? "text-2xl" : "text-xl"} leading-none font-extrabold ${
            template.id === "editorial" ? "font-serif" : ""
          } ${template.previewHeadingClass}`}
          style={{ color: template.accent }}
        >
          {formatMoney(total, invoice.currency)}
        </p>
        <p className={`mt-2 text-xs font-medium ${template.previewBodyClass}`}>
          {joinBlock(invoice.status, `Due ${invoice.dueDate || "-"}`)}
        </p>
      </div>
    </div>
  );
}

function renderLedger(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Label color={template.labelTone}>Tax Invoice</Label>
            <h1
              className={`mt-2 break-words text-3xl font-extrabold tracking-tight ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft Invoice"}
            </h1>
            <div className={`mt-3 space-y-0.5 text-xs ${template.previewBodyClass}`}>
              <p>Issued: {invoice.issueDate || "-"}</p>
              <p>Due: {invoice.dueDate || "-"}</p>
              {invoice.status === "Paid" ? <p>Paid: {invoice.paidDate || "-"}</p> : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className="rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border"
              style={{
                color: template.accent,
                borderColor: `${template.accent}33`,
                backgroundColor: template.accentSoft,
              }}
            >
              {invoice.status}
            </span>
            <div className="text-left sm:text-right">
              <Label color={template.labelTone}>Total Due</Label>
              <p
                className="mt-1 text-2xl font-bold tracking-tight"
                style={{ color: template.accent }}
              >
                {formatMoney(ctx.total, invoice.currency)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 border-b border-stone-200 py-6 sm:grid-cols-2">
        <PartyBlock
          label="Billed By"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Billed To"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} />

      <section className="grid gap-6 border-t border-stone-200 pt-6 sm:grid-cols-[1.2fr_0.8fr]">
        <SupportSections ctx={ctx} />
        <div className="border-t border-stone-200 pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
          <SummaryBlock ctx={ctx} />
        </div>
      </section>
    </>
  );
}

function renderEditorial(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-stone-200 pb-7">
        <div className="grid gap-6 sm:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Label color={template.labelTone}>Tax Invoice</Label>
            <h1
              className={`mt-2 break-words font-serif text-3xl font-extrabold ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft Invoice"}
            </h1>
            <p className={`mt-2 text-xs leading-relaxed ${template.previewBodyClass}`}>
              Billing statement from {invoice.businessName || "Business"} for{" "}
              {invoice.clientName || "Client"}.
            </p>
          </div>

          <div className="sm:border-l sm:border-stone-200 sm:pl-6">
            <div className="flex justify-between text-xs">
              <Label color={template.labelTone}>Issued</Label>
              <span className="font-semibold">{invoice.issueDate || "-"}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <Label color={template.labelTone}>Due Date</Label>
              <span className="font-semibold">{invoice.dueDate || "-"}</span>
            </div>
            <div className="mt-4 border-t border-stone-200 pt-3">
              <Label color={template.labelTone}>Total Due</Label>
              <p
                className="mt-1 font-serif text-2xl font-bold"
                style={{ color: template.accent }}
              >
                {formatMoney(ctx.total, invoice.currency)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-8 py-7 sm:grid-cols-2">
        <PartyBlock
          label="Billed By"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
          editorial
        />
        <PartyBlock
          label="Billed To"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
          editorial
        />
      </section>

      <LineItemTable ctx={ctx} openRows />

      <section className="grid gap-8 border-t border-stone-200 pt-6 sm:grid-cols-[1.1fr_0.9fr]">
        <SupportSections ctx={ctx} compact />
        <div className="sm:border-l sm:border-stone-200 sm:pl-8">
          <SummaryBlock ctx={ctx} large />
        </div>
      </section>
    </>
  );
}

function renderModern(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <div className="h-2 w-20 rounded" style={{ backgroundColor: template.accent }} />
      <header className="grid gap-6 border-b border-stone-200 py-6 sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Label color={template.labelTone}>Tax Invoice</Label>
          <h1
            className={`mt-2 break-words text-3xl font-extrabold tracking-tight ${template.previewHeadingClass}`}
          >
            {invoice.invoiceNumber || "Draft Invoice"}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <Label color={template.labelTone}>Issued</Label>
            <p className="mt-1 font-semibold">{invoice.issueDate || "-"}</p>
          </div>
          <div>
            <Label color={template.labelTone}>Due Date</Label>
            <p className="mt-1 font-semibold">{invoice.dueDate || "-"}</p>
          </div>
          <div>
            <Label color={template.labelTone}>Status</Label>
            <p className="mt-1 font-semibold">{invoice.status}</p>
          </div>
          <div>
            <Label color={template.labelTone}>Total Due</Label>
            <p className="mt-1 font-bold text-sm" style={{ color: template.accent }}>
              {formatMoney(ctx.total, invoice.currency)}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 py-6 sm:grid-cols-2">
        <PartyBlock
          label="Billed By"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Billed To"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} strongHeader />

      <section className="grid gap-8 border-t border-stone-200 pt-6 sm:grid-cols-[0.95fr_1.05fr]">
        <SummaryBlock ctx={ctx} />
        <SupportSections ctx={ctx} />
      </section>
    </>
  );
}

function renderWarm(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label color={template.labelTone}>Tax Invoice</Label>
            <p className={`mt-2 text-lg font-bold ${template.previewHeadingClass}`}>
              {invoice.businessName || "-"}
            </p>
            <h1 className={`mt-1 text-2xl font-extrabold ${template.previewHeadingClass}`}>
              {invoice.invoiceNumber || "Draft Invoice"}
            </h1>
          </div>
          <div className="text-left sm:text-right">
            <Label color={template.labelTone}>Amount Due</Label>
            <p className="mt-1 text-2xl font-bold" style={{ color: template.accent }}>
              {formatMoney(ctx.total, invoice.currency)}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <PartyBlock
          label="Billed By"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Billed To"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} />

      <section className="border-t border-stone-200 pt-6">
        <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr]">
          <SupportSections ctx={ctx} />
          <div className="border-t border-stone-200 pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
            <SummaryBlock ctx={ctx} large />
          </div>
        </div>
      </section>
    </>
  );
}

function renderContractor(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-t-4 border-stone-900 pb-5 pt-3" style={{ borderTopColor: template.accent }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Label color={template.labelTone}>Tax Invoice</Label>
            <h1 className={`mt-2 text-2xl font-bold ${template.previewHeadingClass}`}>
              {invoice.invoiceNumber || "Draft Invoice"}
            </h1>
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-l border-stone-200 pl-4">
              <div>
                <Label color={template.labelTone}>Issued</Label>
                <p className="font-semibold">{invoice.issueDate || "-"}</p>
              </div>
              <div>
                <Label color={template.labelTone}>Due</Label>
                <p className="font-semibold">{invoice.dueDate || "-"}</p>
              </div>
              <div>
                <Label color={template.labelTone}>Balance</Label>
                <p className="font-bold">{formatMoney(ctx.total, invoice.currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 border-y border-stone-200 py-5 sm:grid-cols-2">
        <PartyBlock
          label="Supplier"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Customer"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} strongHeader compact />

      <section className="grid gap-6 border-t border-stone-200 pt-5 sm:grid-cols-[1fr_0.9fr]">
        <SupportSections ctx={ctx} compact />
        <div className="sm:border-l sm:border-stone-200 sm:pl-6">
          <SummaryBlock ctx={ctx} />
        </div>
      </section>
    </>
  );
}

function renderStatement(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-stone-200 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label color={template.labelTone}>Statement Tax Invoice</Label>
            <p className={`mt-2 text-base font-bold ${template.previewHeadingClass}`}>
              {invoice.businessName || "-"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <Label color={template.labelTone}>Balance Due</Label>
            <p className="mt-1 text-2xl font-bold" style={{ color: template.accent }}>
              {formatMoney(ctx.total, invoice.currency)}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 border-b border-stone-200 py-5 sm:grid-cols-2">
        <PartyBlock
          label="Billed By"
          name={invoice.businessName}
          tin={invoice.businessTin}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Billed To"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} compact />

      <section className="grid gap-6 border-t border-stone-200 pt-5 sm:grid-cols-[1fr_0.85fr]">
        <SupportSections ctx={ctx} compact signatureOnTop />
        <div className="sm:border-l sm:border-stone-200 sm:pl-6">
          <SummaryBlock ctx={ctx} />
        </div>
      </section>
    </>
  );
}

export default function InvoicePreview({
  invoice,
  items,
  className = "",
}: InvoicePreviewProps) {
  const template = getInvoiceTemplate(invoice.template);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(invoice, items);

  const ctx: PreviewContext = {
    invoice,
    items,
    subtotal,
    taxAmount,
    total,
    template,
  };

  const content = (() => {
    switch (template.id) {
      case "editorial":
        return renderEditorial(ctx);
      case "modern":
        return renderModern(ctx);
      case "warm":
        return renderWarm(ctx);
      case "contractor":
        return renderContractor(ctx);
      case "statement":
        return renderStatement(ctx);
      default:
        return renderLedger(ctx);
    }
  })();

  return (
    <article
      className={`mx-auto w-full max-w-[850px] bg-white p-6 shadow-md rounded-xl sm:p-10 ${className}`}
      style={{ backgroundColor: template.pageTone }}
    >
      {content}
    </article>
  );
}
