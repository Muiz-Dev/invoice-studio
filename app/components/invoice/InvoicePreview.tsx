import type { ReactNode } from "react";
import {
  computeInvoiceTotals,
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
      className={`text-[0.62rem] uppercase tracking-[0.3em] ${className}`}
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
  template,
  editorial = false,
}: {
  label: string;
  name?: string;
  lines: string[];
  template: PreviewContext["template"];
  editorial?: boolean;
}) {
  return (
    <div>
      <Label color={template.labelTone}>{label}</Label>
      <p
        className={`mt-4 break-words text-[1.18rem] leading-tight ${
          editorial ? "font-serif" : "font-semibold"
        } ${template.previewHeadingClass}`}
      >
        {name || "-"}
      </p>
      <div className={`mt-3 space-y-1 text-sm leading-6 ${template.previewBodyClass}`}>
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
    <section className={compact ? "py-5" : "py-7"}>
      <div
        className={`grid grid-cols-[1.5fr_0.55fr_0.75fr_0.8fr] gap-4 pb-3 ${
          strongHeader ? "border-y border-black/10 py-3" : "border-b border-black/10"
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

      <div className={openRows ? "space-y-4 pt-4" : "divide-y divide-black/10"}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid grid-cols-[1.5fr_0.55fr_0.75fr_0.8fr] gap-4 ${
              openRows ? "" : "py-4"
            }`}
          >
            <p className={`text-sm leading-6 ${template.previewHeadingClass}`}>
              {item.description}
            </p>
            <p className={`text-right text-sm ${template.previewBodyClass}`}>
              {item.quantity}
            </p>
            <p className={`text-right text-sm ${template.previewBodyClass}`}>
              {formatMoney(item.rate, invoice.currency)}
            </p>
            <p className={`text-right text-sm ${template.previewHeadingClass}`}>
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

  const blocks = [
    invoice.showPaymentDetails && invoice.paymentDetails.trim()
      ? {
          key: "payment",
          title: "Payment details",
          content: invoice.paymentDetails,
        }
      : null,
    (invoice.paymentReference || "").trim()
      ? {
          key: "reference",
          title: "Payment reference",
          content: invoice.paymentReference,
        }
      : null,
    invoice.showNotes && invoice.notes.trim()
      ? {
          key: "notes",
          title: "Notes",
          content: invoice.notes,
        }
      : null,
  ].filter(Boolean) as { key: string; title: string; content: string }[];

  const signatureBlock = invoice.showSignature ? (
    <div key="signature" className={signatureOnTop ? "" : "pt-1"}>
      <Label color={template.labelTone}>Authorized signature</Label>
      <div className="mt-4 flex flex-col items-start">
        {invoice.signatureDataUrl ? (
          <img
            src={invoice.signatureDataUrl}
            alt="Signature"
            className="h-14 w-auto object-contain"
          />
        ) : (
          <div className="h-8 w-32 border-b border-black/25" />
        )}
        <p
          className={`mt-3 text-sm ${
            template.id === "editorial" ? "font-serif text-base" : "font-semibold"
          } ${template.previewHeadingClass}`}
        >
          {invoice.signatureName}
        </p>
        <p className={`text-xs uppercase tracking-[0.22em] ${template.previewBodyClass}`}>
          {invoice.signatureTitle}
        </p>
      </div>
    </div>
  ) : null;

  const contentBlocks = blocks.map((block) => (
    <div key={block.key}>
      <Label color={template.labelTone}>{block.title}</Label>
      <p
        className={`mt-3 whitespace-pre-line text-sm leading-7 ${template.previewBodyClass}`}
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
  heading = "Settlement",
}: {
  ctx: PreviewContext;
  large?: boolean;
  heading?: string;
}) {
  const { template, subtotal, taxAmount, total, invoice } = ctx;

  return (
    <div className="space-y-4">
      <Label color={template.labelTone}>{heading}</Label>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className={template.previewBodyClass}>Subtotal</span>
          <span className={template.previewHeadingClass}>
            {formatMoney(subtotal, invoice.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={template.previewBodyClass}>
            Tax ({invoice.taxRate}%)
          </span>
          <span className={template.previewHeadingClass}>
            {formatMoney(taxAmount, invoice.currency)}
          </span>
        </div>
      </div>
      <div className="border-t border-black/10 pt-4">
        <p
          className={`${large ? "text-[2rem]" : "text-2xl"} leading-none ${
            template.id === "editorial" ? "font-serif tracking-[-0.04em]" : "font-semibold tracking-[-0.05em]"
          } ${template.previewHeadingClass}`}
          style={{ color: template.accent }}
        >
          {formatMoney(total, invoice.currency)}
        </p>
        <p className={`mt-2 text-sm ${template.previewBodyClass}`}>
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
      <header className="border-b border-black/10 pb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <Label color={template.labelTone} className="tracking-[0.34em]">
              Invoice
            </Label>
            <h1
              className={`mt-3 break-words text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold tracking-[-0.05em] ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft invoice"}
            </h1>
            <div
              className={`mt-5 space-y-1 text-sm leading-6 ${template.previewBodyClass}`}
            >
              <p>Issued {invoice.issueDate || "-"}</p>
              <p>Service date {invoice.serviceDate || "-"}</p>
              <p>Due {invoice.dueDate || "-"}</p>
              {invoice.status === "Paid" ? <p>Paid {invoice.paidDate || "-"}</p> : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <div
              className="inline-flex items-center border px-4 py-2 text-[0.62rem] uppercase tracking-[0.3em]"
              style={{
                color: template.accent,
                borderColor: `${template.accent}22`,
                backgroundColor: template.accentSoft,
              }}
            >
              {invoice.status}
            </div>
            <div className="text-left sm:text-right">
              <Label color={template.labelTone} className="tracking-[0.28em]">
                Total due
              </Label>
              <p
                className="mt-2 text-3xl font-semibold leading-none tracking-[-0.05em]"
                style={{ color: template.accent }}
              >
                {formatMoney(ctx.total, invoice.currency)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-10 border-b border-black/10 py-7 sm:grid-cols-[1fr_1fr]">
        <PartyBlock
          label="From"
          name={invoice.businessName}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Bill to"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} />

      <section className="grid gap-8 border-t border-black/10 pt-7 sm:grid-cols-[1.2fr_0.8fr]">
        <SupportSections ctx={ctx} />
        <div className="space-y-4 border-t border-black/10 pt-5 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
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
      <header className="border-b border-black/10 pb-9">
        <div className="grid gap-8 sm:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Label color={template.labelTone} className="tracking-[0.36em]">
              Invoice
            </Label>
            <h1
              className={`mt-4 break-words font-serif text-[clamp(2.6rem,4.8vw,4.3rem)] leading-[0.92] tracking-[-0.05em] ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft invoice"}
            </h1>
            <p className={`mt-4 max-w-md text-sm leading-7 ${template.previewBodyClass}`}>
              {invoice.businessName || "Business"} presents the billing record
              for the work completed for {invoice.clientName || "this client"}.
            </p>
          </div>

          <div className="sm:pl-8 sm:border-l sm:border-black/10">
            <div className="flex items-center justify-between">
              <Label color={template.labelTone}>Issued</Label>
              <p className={`text-sm ${template.previewHeadingClass}`}>
                {invoice.issueDate || "-"}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Label color={template.labelTone}>Due</Label>
              <p className={`text-sm ${template.previewHeadingClass}`}>
                {invoice.dueDate || "-"}
              </p>
            </div>
            <div className="mt-6 border-t border-black/10 pt-5">
              <Label color={template.labelTone}>Total due</Label>
              <p
                className="mt-3 font-serif text-[2.4rem] leading-none tracking-[-0.05em]"
                style={{ color: template.accent }}
              >
                {formatMoney(ctx.total, invoice.currency)}
              </p>
              <p className={`mt-2 text-sm ${template.previewBodyClass}`}>
                {invoice.status}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-12 py-9 sm:grid-cols-[1fr_1fr]">
        <PartyBlock
          label="From"
          name={invoice.businessName}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
          editorial
        />
        <PartyBlock
          label="Bill to"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
          editorial
        />
      </section>

      <LineItemTable ctx={ctx} openRows />

      <section className="grid gap-10 border-t border-black/10 pt-8 sm:grid-cols-[1.1fr_0.9fr]">
        <SupportSections ctx={ctx} compact />
        <div className="sm:pl-10 sm:border-l sm:border-black/10">
          <SummaryBlock ctx={ctx} large heading="Settlement" />
        </div>
      </section>
    </>
  );
}

function renderModern(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <div
        className="h-3 w-24"
        style={{ backgroundColor: template.accent }}
      />
      <header className="grid gap-8 border-b border-black/10 py-7 sm:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Label color={template.labelTone}>Studio invoice</Label>
          <h1
            className={`mt-4 break-words text-[clamp(2.4rem,4.8vw,4rem)] font-semibold leading-[0.92] tracking-[-0.06em] ${template.previewHeadingClass}`}
          >
            {invoice.invoiceNumber || "Draft invoice"}
          </h1>
          <p className={`mt-4 max-w-md text-sm leading-7 ${template.previewBodyClass}`}>
            A sharp invoice composition built for product, branding, and studio
            teams that want a more assertive document presence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-l border-black/10 pl-4">
            <Label color={template.labelTone}>Issued</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.issueDate || "-"}
            </p>
          </div>
          <div className="border-l border-black/10 pl-4">
            <Label color={template.labelTone}>Due</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.dueDate || "-"}
            </p>
          </div>
          <div className="border-l border-black/10 pl-4">
            <Label color={template.labelTone}>Status</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.status}
            </p>
          </div>
          <div className="border-l border-black/10 pl-4">
            <Label color={template.labelTone}>Total due</Label>
            <p
              className="mt-2 text-2xl font-semibold leading-none tracking-[-0.05em]"
              style={{ color: template.accent }}
            >
              {formatMoney(ctx.total, invoice.currency)}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-10 py-7 sm:grid-cols-[1.1fr_0.9fr]">
        <PartyBlock
          label="From"
          name={invoice.businessName}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Bill to"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} strongHeader />

      <section className="grid gap-10 border-t border-black/10 pt-7 sm:grid-cols-[0.95fr_1.05fr]">
        <div className="pt-1">
          <SummaryBlock ctx={ctx} heading="Balance" />
        </div>
        <SupportSections ctx={ctx} />
      </section>
    </>
  );
}

function renderWarm(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-black/10 pb-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label color={template.labelTone}>Service invoice</Label>
            <p
              className={`mt-4 text-[1.35rem] font-semibold leading-tight ${template.previewHeadingClass}`}
            >
              {invoice.businessName || "-"}
            </p>
            <h1
              className={`mt-3 break-words text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[0.96] tracking-[-0.05em] ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft invoice"}
            </h1>
          </div>
          <div className="max-w-xs">
            <Label color={template.labelTone}>This invoice covers</Label>
            <p className={`mt-3 text-sm leading-7 ${template.previewBodyClass}`}>
              Work delivered for {invoice.clientName || "the client"}, due on{" "}
              {invoice.dueDate || "-"}.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 py-7 sm:grid-cols-[1fr_1fr]">
        <PartyBlock
          label="From"
          name={invoice.businessName}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <div className="space-y-6">
          <PartyBlock
            label="Bill to"
            name={invoice.clientName}
            lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
              Boolean
            ) as string[]}
            template={template}
          />
          <div className="border-t border-black/10 pt-5">
            <Label color={template.labelTone}>Invoice details</Label>
            <div className={`mt-3 space-y-1 text-sm leading-7 ${template.previewBodyClass}`}>
              <p>Issued {invoice.issueDate || "-"}</p>
              <p>Service date {invoice.serviceDate || "-"}</p>
              <p>{invoice.status}</p>
            </div>
          </div>
        </div>
      </section>

      <LineItemTable ctx={ctx} />

      <section className="border-t border-black/10 pt-7">
        <div className="grid gap-8 sm:grid-cols-[1.1fr_0.9fr]">
          <SupportSections ctx={ctx} />
          <div className="border-t border-black/10 pt-5 sm:border-t-0 sm:pl-8 sm:border-l sm:border-black/10 sm:pt-0">
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
      <header className="border-t-4 border-black pb-6 pt-4" style={{ borderTopColor: template.accent }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Label color={template.labelTone}>Contractor invoice</Label>
            <h1
              className={`mt-3 break-words text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em] ${template.previewHeadingClass}`}
            >
              {invoice.invoiceNumber || "Draft invoice"}
            </h1>
          </div>
          <div className="min-w-[260px]">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-l border-black/10 pl-5 text-sm">
              <div>
                <Label color={template.labelTone}>Issued</Label>
                <p className={`mt-2 ${template.previewHeadingClass}`}>
                  {invoice.issueDate || "-"}
                </p>
              </div>
              <div>
                <Label color={template.labelTone}>Due</Label>
                <p className={`mt-2 ${template.previewHeadingClass}`}>
                  {invoice.dueDate || "-"}
                </p>
              </div>
              <div>
                <Label color={template.labelTone}>Status</Label>
                <p className={`mt-2 ${template.previewHeadingClass}`}>
                  {invoice.status}
                </p>
              </div>
              <div>
                <Label color={template.labelTone}>Balance</Label>
                <p className={`mt-2 font-semibold ${template.previewHeadingClass}`}>
                  {formatMoney(ctx.total, invoice.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-8 border-y border-black/10 py-6 sm:grid-cols-[1fr_1fr]">
        <PartyBlock
          label="Supplier"
          name={invoice.businessName}
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

      <section className="grid gap-8 border-t border-black/10 pt-6 sm:grid-cols-[1fr_0.9fr]">
        <SupportSections ctx={ctx} compact />
        <div className="sm:pl-8 sm:border-l sm:border-black/10">
          <SummaryBlock ctx={ctx} heading="Settlement" />
        </div>
      </section>
    </>
  );
}

function renderStatement(ctx: PreviewContext) {
  const { invoice, template } = ctx;

  return (
    <>
      <header className="border-b border-black/10 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Label color={template.labelTone}>Statement invoice</Label>
            <p className={`mt-4 text-[1.2rem] font-semibold ${template.previewHeadingClass}`}>
              {invoice.businessName || "-"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <Label color={template.labelTone}>Balance due</Label>
            <p
              className="mt-3 text-[2.2rem] font-semibold leading-none tracking-[-0.05em]"
              style={{ color: template.accent }}
            >
              {formatMoney(ctx.total, invoice.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-black/10 pt-4 sm:grid-cols-4">
          <div>
            <Label color={template.labelTone}>Invoice no</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.invoiceNumber || "-"}
            </p>
          </div>
          <div>
            <Label color={template.labelTone}>Issued</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.issueDate || "-"}
            </p>
          </div>
          <div>
            <Label color={template.labelTone}>Due</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.dueDate || "-"}
            </p>
          </div>
          <div>
            <Label color={template.labelTone}>Status</Label>
            <p className={`mt-2 text-sm ${template.previewHeadingClass}`}>
              {invoice.status}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 border-b border-black/10 py-7 sm:grid-cols-[1fr_1fr]">
        <PartyBlock
          label="Supplier"
          name={invoice.businessName}
          lines={[
            ...splitLines(invoice.businessAddress),
            invoice.businessEmail,
            invoice.businessPhone,
          ].filter(Boolean) as string[]}
          template={template}
        />
        <PartyBlock
          label="Account billed"
          name={invoice.clientName}
          lines={[invoice.clientEmail, ...splitLines(invoice.clientAddress)].filter(
            Boolean
          ) as string[]}
          template={template}
        />
      </section>

      <LineItemTable ctx={ctx} compact />

      <section className="grid gap-8 border-t border-black/10 pt-6 sm:grid-cols-[1fr_0.85fr]">
        <SupportSections ctx={ctx} compact signatureOnTop />
        <div className="sm:pl-8 sm:border-l sm:border-black/10">
          <SummaryBlock ctx={ctx} heading="Balance summary" />
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
      className={`mx-auto w-full max-w-[860px] bg-white px-6 py-7 shadow-[0_28px_80px_rgba(20,16,10,0.08)] sm:px-10 sm:py-10 ${className}`}
      style={{ backgroundColor: template.pageTone }}
    >
      {content}
    </article>
  );
}
