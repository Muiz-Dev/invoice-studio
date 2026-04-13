import type { ReactNode } from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  computeInvoiceTotals,
  formatMoney,
  getInvoiceTemplate,
  type InvoicePayload,
} from "./invoice-data";

type PdfContext = {
  invoice: InvoicePayload["invoice"];
  items: InvoicePayload["items"];
  subtotal: number;
  taxAmount: number;
  total: number;
  template: ReturnType<typeof getInvoiceTemplate>;
};

const splitLines = (value?: string) =>
  (value || "")
    .split(/\r\n|\n|\r/g)
    .map((line) => line.trim())
    .filter(Boolean);

const pdfBorderColor = (templateId: PdfContext["template"]["id"]) => {
  switch (templateId) {
    case "editorial":
      return "#d6cbbd";
    case "modern":
      return "#c7d8ea";
    case "warm":
      return "#ead7a9";
    case "contractor":
      return "#cbd5e1";
    case "statement":
      return "#d1d5db";
    default:
      return "#d6d3d1";
  }
};

const pdfStrongBorderColor = (templateId: PdfContext["template"]["id"]) => {
  switch (templateId) {
    case "editorial":
      return "#bba992";
    case "modern":
      return "#94b8de";
    case "warm":
      return "#d7b97d";
    case "contractor":
      return "#94a3b8";
    case "statement":
      return "#9ca3af";
    default:
      return "#a8a29e";
  }
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 38,
    paddingLeft: 34,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#171717",
  },
  label: {
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 2.3,
  },
  smallMeta: {
    fontSize: 10,
    lineHeight: 1.55,
  },
  body: {
    fontSize: 10.4,
    lineHeight: 1.62,
  },
  title: {
    fontSize: 28,
    lineHeight: 1,
    fontFamily: "Helvetica-Bold",
  },
  titleSerif: {
    fontSize: 30,
    lineHeight: 1,
    fontFamily: "Times-Bold",
  },
  bigTotal: {
    fontSize: 22,
    lineHeight: 1,
    fontFamily: "Helvetica-Bold",
  },
  bigTotalSerif: {
    fontSize: 24,
    lineHeight: 1,
    fontFamily: "Times-Bold",
  },
  partyName: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.18,
    fontFamily: "Helvetica-Bold",
  },
  partyNameSerif: {
    fontSize: 16,
    lineHeight: 1.15,
    fontFamily: "Times-Bold",
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  tableHeaderStrong: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  itemRow: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    minHeight: 42,
  },
  itemRowOpen: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 42,
  },
  colDesc: {
    flex: 1.8,
    paddingRight: 10,
  },
  colQty: {
    flex: 0.5,
    textAlign: "right",
  },
  colRate: {
    flex: 0.85,
    textAlign: "right",
  },
  colAmount: {
    flex: 0.9,
    textAlign: "right",
  },
  itemText: {
    fontSize: 10.3,
    lineHeight: 1.5,
  },
  itemTextStrong: {
    fontSize: 10.3,
    lineHeight: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  signatureImage: {
    width: 120,
    height: 40,
    objectFit: "contain",
    marginTop: 10,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    marginTop: 12,
  },
  signatureName: {
    marginTop: 10,
    fontSize: 10.2,
    fontFamily: "Helvetica-Bold",
  },
  signatureNameSerif: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: "Times-Bold",
  },
  signatureTitle: {
    marginTop: 3,
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 10.1,
    lineHeight: 1.5,
  },
  summaryValue: {
    fontSize: 10.1,
    lineHeight: 1.5,
    textAlign: "right",
  },
  totalBreak: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalBreakTight: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  grandTotal: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalSerif: {
    fontSize: 15,
    fontFamily: "Times-Bold",
  },
  settlementMeta: {
    marginTop: 7,
    fontSize: 9.2,
    lineHeight: 1.55,
  },
});

function PdfLabel({
  ctx,
  children,
}: {
  ctx: PdfContext;
  children: ReactNode;
}) {
  return (
    <Text style={{ ...styles.label, color: ctx.template.labelTone }}>
      {children}
    </Text>
  );
}

function PdfPartyBlock({
  ctx,
  label,
  name,
  lines,
  serif = false,
}: {
  ctx: PdfContext;
  label: string;
  name?: string;
  lines: string[];
  serif?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <PdfLabel ctx={ctx}>{label}</PdfLabel>
      <Text
        style={
          serif
            ? { ...styles.partyNameSerif, color: ctx.template.accent }
            : { ...styles.partyName, color: ctx.template.accent }
        }
      >
        {name || "-"}
      </Text>
      {(lines.length ? lines : ["-"]).map((line) => (
        <Text key={`${label}-${line}`} style={styles.body}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function PdfLineTable({
  ctx,
  strongHeader = false,
  openRows = false,
}: {
  ctx: PdfContext;
  strongHeader?: boolean;
  openRows?: boolean;
}) {
  const headerStyle = strongHeader
    ? {
        ...styles.tableHeaderStrong,
        borderTopColor: pdfBorderColor(ctx.template.id),
        borderBottomColor: pdfBorderColor(ctx.template.id),
        backgroundColor: ctx.template.accentSoft,
      }
    : {
        ...styles.tableHeader,
        borderBottomColor: pdfBorderColor(ctx.template.id),
      };

  return (
    <View style={{ marginTop: 22 }}>
      <View style={headerStyle}>
        <Text
          style={{
            ...styles.tableHeaderText,
            ...styles.colDesc,
            color: ctx.template.labelTone,
          }}
        >
          Description
        </Text>
        <Text
          style={{
            ...styles.tableHeaderText,
            ...styles.colQty,
            color: ctx.template.labelTone,
          }}
        >
          Qty
        </Text>
        <Text
          style={{
            ...styles.tableHeaderText,
            ...styles.colRate,
            color: ctx.template.labelTone,
          }}
        >
          Rate
        </Text>
        <Text
          style={{
            ...styles.tableHeaderText,
            ...styles.colAmount,
            color: ctx.template.labelTone,
          }}
        >
          Amount
        </Text>
      </View>

      {ctx.items.map((item, index) => {
        const isLast = index === ctx.items.length - 1;
        const amount = (item.quantity || 0) * (item.rate || 0);

        return (
          <View
            key={`${item.description || "item"}-${index}`}
            style={
              openRows
                ? styles.itemRowOpen
                : {
                    ...styles.itemRow,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: pdfBorderColor(ctx.template.id),
                  }
            }
          >
            <Text style={{ ...styles.itemTextStrong, ...styles.colDesc }}>
              {item.description || "-"}
            </Text>
            <Text style={{ ...styles.itemText, ...styles.colQty }}>
              {item.quantity || 0}
            </Text>
            <Text style={{ ...styles.itemText, ...styles.colRate }}>
              {formatMoney(item.rate || 0, ctx.invoice.currency)}
            </Text>
            <Text style={{ ...styles.itemTextStrong, ...styles.colAmount }}>
              {formatMoney(amount, ctx.invoice.currency)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function PdfSupport({
  ctx,
  signatureFirst = false,
}: {
  ctx: PdfContext;
  signatureFirst?: boolean;
}) {
  const blocks = [
    ctx.invoice.showPaymentDetails && ctx.invoice.paymentDetails?.trim()
      ? {
          key: "payment",
          title: "Payment details",
          value: ctx.invoice.paymentDetails,
        }
      : null,
    ctx.invoice.paymentReference?.trim()
      ? {
          key: "reference",
          title: "Payment reference",
          value: ctx.invoice.paymentReference,
        }
      : null,
    ctx.invoice.showNotes && ctx.invoice.notes?.trim()
      ? {
          key: "notes",
          title: "Notes",
          value: ctx.invoice.notes,
        }
      : null,
  ].filter(Boolean) as { key: string; title: string; value: string }[];

  const signatureBlock =
    ctx.invoice.showSignature !== false ? (
      <View key="signature" style={{ marginTop: signatureFirst ? 0 : 4 }}>
        <PdfLabel ctx={ctx}>Authorized signature</PdfLabel>
        {ctx.invoice.signatureDataUrl ? (
          <Image src={ctx.invoice.signatureDataUrl} style={styles.signatureImage} />
        ) : (
          <View
            style={{
              ...styles.signatureLine,
              borderBottomColor: pdfStrongBorderColor(ctx.template.id),
            }}
          />
        )}
        <Text
          style={
            ctx.template.id === "editorial"
              ? { ...styles.signatureNameSerif, color: ctx.template.accent }
              : { ...styles.signatureName, color: ctx.template.accent }
          }
        >
          {ctx.invoice.signatureName || ""}
        </Text>
        <Text style={{ ...styles.signatureTitle, color: ctx.template.labelTone }}>
          {ctx.invoice.signatureTitle || ""}
        </Text>
      </View>
    ) : null;

  const contentBlocks = blocks.map((block) => (
    <View key={block.key} style={{ marginBottom: 14 }}>
      <PdfLabel ctx={ctx}>{block.title}</PdfLabel>
      {splitLines(block.value).map((line) => (
        <Text key={`${block.key}-${line}`} style={{ ...styles.body, marginTop: 6 }}>
          {line}
        </Text>
      ))}
    </View>
  ));

  return (
    <View style={{ flex: 1.1 }}>
      {(signatureFirst
        ? [signatureBlock, ...contentBlocks]
        : [...contentBlocks, signatureBlock]
      ).filter(Boolean)}
    </View>
  );
}

function PdfSummary({
  ctx,
  heading = "Settlement",
  large = false,
}: {
  ctx: PdfContext;
  heading?: string;
  large?: boolean;
}) {
  const totalTextStyle =
    ctx.template.id === "editorial"
      ? large
        ? { ...styles.bigTotalSerif, fontSize: 26, color: ctx.template.accent }
        : { ...styles.grandTotalSerif, color: ctx.template.accent }
      : large
        ? { ...styles.bigTotal, fontSize: 24, color: ctx.template.accent }
        : { ...styles.grandTotal, color: ctx.template.accent };

  return (
    <View style={{ flex: 0.85 }}>
      <PdfLabel ctx={ctx}>{heading}</PdfLabel>
      <View style={{ marginTop: 10 }}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(ctx.subtotal, ctx.invoice.currency)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax ({ctx.invoice.taxRate}%)</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(ctx.taxAmount, ctx.invoice.currency)}
          </Text>
        </View>
      </View>
      <View
        style={{
          ...(large ? styles.totalBreak : styles.totalBreakTight),
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={styles.summaryRow}>
          <Text style={totalTextStyle}>Total</Text>
          <Text style={totalTextStyle}>
            {formatMoney(ctx.total, ctx.invoice.currency)}
          </Text>
        </View>
        {ctx.invoice.paymentReference ? (
          <Text style={{ ...styles.settlementMeta, color: ctx.template.labelTone }}>
            Reference {ctx.invoice.paymentReference}
          </Text>
        ) : null}
        <Text style={{ ...styles.settlementMeta, color: ctx.template.labelTone }}>
          {ctx.invoice.status || "Draft"} • Due {ctx.invoice.dueDate || "-"}
        </Text>
      </View>
    </View>
  );
}

function renderLedger(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flex: 1 }}>
          <PdfLabel ctx={ctx}>Invoice</PdfLabel>
          <Text style={{ ...styles.title, color: ctx.template.accent, marginTop: 10 }}>
            {ctx.invoice.invoiceNumber || "Draft invoice"}
          </Text>
          <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone, marginTop: 10 }}>
            Issued {ctx.invoice.issueDate || "-"}
          </Text>
          <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone }}>
            Service date {ctx.invoice.serviceDate || "-"}
          </Text>
          <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone }}>
            Due {ctx.invoice.dueDate || "-"}
          </Text>
        </View>

        <View style={{ minWidth: 148, alignItems: "flex-end" }}>
          <Text
            style={{
              ...styles.label,
              color: ctx.template.accent,
              backgroundColor: ctx.template.accentSoft,
              borderColor: pdfBorderColor(ctx.template.id),
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            {ctx.invoice.status}
          </Text>
          <Text style={{ ...styles.label, color: ctx.template.labelTone, marginTop: 20 }}>
            Total due
          </Text>
          <Text style={{ ...styles.bigTotal, color: ctx.template.accent, marginTop: 10 }}>
            {formatMoney(ctx.total, ctx.invoice.currency)}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingTop: 22,
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfPartyBlock
          ctx={ctx}
          label="From"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
        />
        <View style={{ width: 26 }} />
        <PdfPartyBlock
          ctx={ctx}
          label="Bill to"
          name={ctx.invoice.clientName}
          lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
            Boolean
          )}
        />
      </View>

      <PdfLineTable ctx={ctx} />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfSupport ctx={ctx} />
        <View
          style={{
            width: 24,
          }}
        />
        <View
          style={{
            flex: 0.85,
            paddingLeft: 22,
            borderLeftWidth: 1,
            borderLeftColor: pdfBorderColor(ctx.template.id),
          }}
        >
          <PdfSummary ctx={ctx} />
        </View>
      </View>
    </>
  );
}

function renderEditorial(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          paddingBottom: 26,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1.15 }}>
            <PdfLabel ctx={ctx}>Invoice</PdfLabel>
            <Text
              style={{
                ...styles.titleSerif,
                color: ctx.template.accent,
                marginTop: 12,
              }}
            >
              {ctx.invoice.invoiceNumber || "Draft invoice"}
            </Text>
            <Text style={{ ...styles.body, marginTop: 12 }}>
              {ctx.invoice.businessName || "Business"} presents the billing
              record for {ctx.invoice.clientName || "this client"}.
            </Text>
          </View>
          <View
            style={{
              flex: 0.85,
              paddingLeft: 26,
              borderLeftWidth: 1,
              borderLeftColor: pdfBorderColor(ctx.template.id),
            }}
          >
            <View style={styles.summaryRow}>
              <PdfLabel ctx={ctx}>Issued</PdfLabel>
              <Text style={styles.smallMeta}>{ctx.invoice.issueDate || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <PdfLabel ctx={ctx}>Due</PdfLabel>
              <Text style={styles.smallMeta}>{ctx.invoice.dueDate || "-"}</Text>
            </View>
            <View style={{ marginTop: 18 }}>
              <PdfLabel ctx={ctx}>Total due</PdfLabel>
              <Text
                style={{
                  ...styles.bigTotalSerif,
                  color: ctx.template.accent,
                  marginTop: 10,
                }}
              >
                {formatMoney(ctx.total, ctx.invoice.currency)}
              </Text>
              <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone, marginTop: 6 }}>
                {ctx.invoice.status}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", paddingTop: 24, paddingBottom: 28 }}>
        <PdfPartyBlock
          ctx={ctx}
          label="From"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
          serif
        />
        <View style={{ width: 30 }} />
        <PdfPartyBlock
          ctx={ctx}
          label="Bill to"
          name={ctx.invoice.clientName}
          lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
            Boolean
          )}
          serif
        />
      </View>

      <PdfLineTable ctx={ctx} openRows />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 26,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfSupport ctx={ctx} />
        <View style={{ width: 30 }} />
        <View
          style={{
            flex: 0.9,
            paddingLeft: 24,
            borderLeftWidth: 1,
            borderLeftColor: pdfBorderColor(ctx.template.id),
          }}
        >
          <PdfSummary ctx={ctx} large />
        </View>
      </View>
    </>
  );
}

function renderModern(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          width: 82,
          height: 10,
          backgroundColor: ctx.template.accent,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          paddingTop: 22,
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flex: 1.1 }}>
          <PdfLabel ctx={ctx}>Studio invoice</PdfLabel>
          <Text style={{ ...styles.title, color: ctx.template.accent, marginTop: 10 }}>
            {ctx.invoice.invoiceNumber || "Draft invoice"}
          </Text>
          <Text style={{ ...styles.body, marginTop: 12 }}>
            A sharper invoice composition for product, studio, and design-driven
            businesses.
          </Text>
        </View>
        <View style={{ width: 24 }} />
        <View style={{ flex: 0.9, flexDirection: "row", flexWrap: "wrap" }}>
          {[
            ["Issued", ctx.invoice.issueDate || "-"],
            ["Due", ctx.invoice.dueDate || "-"],
            ["Status", ctx.invoice.status || "-"],
            ["Total due", formatMoney(ctx.total, ctx.invoice.currency)],
          ].map(([label, value], index) => (
            <View
              key={`${label}-${index}`}
              style={{
                width: "50%",
                paddingLeft: 14,
                marginBottom: 12,
                borderLeftWidth: 1,
                borderLeftColor: pdfBorderColor(ctx.template.id),
              }}
            >
              <PdfLabel ctx={ctx}>{label}</PdfLabel>
              <Text
                style={{
                  ...(label === "Total due" ? styles.bigTotal : styles.smallMeta),
                  color: label === "Total due" ? ctx.template.accent : "#171717",
                  marginTop: 7,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", paddingTop: 22, paddingBottom: 22 }}>
        <PdfPartyBlock
          ctx={ctx}
          label="From"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
        />
        <View style={{ width: 26 }} />
        <PdfPartyBlock
          ctx={ctx}
          label="Bill to"
          name={ctx.invoice.clientName}
          lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
            Boolean
          )}
        />
      </View>

      <PdfLineTable ctx={ctx} strongHeader />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flex: 0.92 }}>
          <PdfSummary ctx={ctx} />
        </View>
        <View style={{ width: 24 }} />
        <PdfSupport ctx={ctx} />
      </View>
    </>
  );
}

function renderWarm(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <PdfLabel ctx={ctx}>Service invoice</PdfLabel>
            <Text style={{ ...styles.partyName, color: ctx.template.accent, marginTop: 12 }}>
              {ctx.invoice.businessName || "-"}
            </Text>
            <Text style={{ ...styles.title, color: "#171717", marginTop: 10 }}>
              {ctx.invoice.invoiceNumber || "Draft invoice"}
            </Text>
          </View>
          <View style={{ width: 150 }}>
            <PdfLabel ctx={ctx}>Due</PdfLabel>
            <Text style={{ ...styles.bigTotal, color: ctx.template.accent, marginTop: 10 }}>
              {formatMoney(ctx.total, ctx.invoice.currency)}
            </Text>
            <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone, marginTop: 6 }}>
              {ctx.invoice.dueDate || "-"}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", paddingTop: 22, paddingBottom: 22 }}>
        <PdfPartyBlock
          ctx={ctx}
          label="From"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
        />
        <View style={{ width: 26 }} />
        <View style={{ flex: 1 }}>
          <PdfPartyBlock
            ctx={ctx}
            label="Bill to"
            name={ctx.invoice.clientName}
            lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
              Boolean
            )}
          />
          <View
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: pdfBorderColor(ctx.template.id),
            }}
          >
            <PdfLabel ctx={ctx}>Invoice details</PdfLabel>
            <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone, marginTop: 8 }}>
              Issued {ctx.invoice.issueDate || "-"}
            </Text>
            <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone }}>
              Service date {ctx.invoice.serviceDate || "-"}
            </Text>
            <Text style={{ ...styles.smallMeta, color: ctx.template.labelTone }}>
              {ctx.invoice.status || "-"}
            </Text>
          </View>
        </View>
      </View>

      <PdfLineTable ctx={ctx} />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfSupport ctx={ctx} />
        <View style={{ width: 24 }} />
        <View
          style={{
            flex: 0.9,
            paddingLeft: 22,
            borderLeftWidth: 1,
            borderLeftColor: pdfBorderColor(ctx.template.id),
          }}
        >
          <PdfSummary ctx={ctx} large />
        </View>
      </View>
    </>
  );
}

function renderContractor(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          borderTopWidth: 4,
          borderTopColor: ctx.template.accent,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <PdfLabel ctx={ctx}>Contractor invoice</PdfLabel>
            <Text style={{ ...styles.title, color: ctx.template.accent, marginTop: 10 }}>
              {ctx.invoice.invoiceNumber || "Draft invoice"}
            </Text>
          </View>
          <View
            style={{
              minWidth: 230,
              paddingLeft: 16,
              borderLeftWidth: 1,
              borderLeftColor: pdfBorderColor(ctx.template.id),
            }}
          >
            <View style={styles.summaryRow}>
              <PdfLabel ctx={ctx}>Issued</PdfLabel>
              <Text style={styles.smallMeta}>{ctx.invoice.issueDate || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <PdfLabel ctx={ctx}>Due</PdfLabel>
              <Text style={styles.smallMeta}>{ctx.invoice.dueDate || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <PdfLabel ctx={ctx}>Status</PdfLabel>
              <Text style={styles.smallMeta}>{ctx.invoice.status || "-"}</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <PdfLabel ctx={ctx}>Balance</PdfLabel>
              <Text style={{ ...styles.bigTotal, color: ctx.template.accent, marginTop: 8 }}>
                {formatMoney(ctx.total, ctx.invoice.currency)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingTop: 18,
          paddingBottom: 18,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfPartyBlock
          ctx={ctx}
          label="Supplier"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
        />
        <View style={{ width: 28 }} />
        <PdfPartyBlock
          ctx={ctx}
          label="Customer"
          name={ctx.invoice.clientName}
          lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
            Boolean
          )}
        />
      </View>

      <PdfLineTable ctx={ctx} strongHeader />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 22,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfSupport ctx={ctx} />
        <View style={{ width: 24 }} />
        <View
          style={{
            flex: 0.9,
            paddingLeft: 22,
            borderLeftWidth: 1,
            borderLeftColor: pdfStrongBorderColor(ctx.template.id),
          }}
        >
          <PdfSummary ctx={ctx} />
        </View>
      </View>
    </>
  );
}

function renderStatement(ctx: PdfContext) {
  return (
    <>
      <View
        style={{
          paddingBottom: 18,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <PdfLabel ctx={ctx}>Statement invoice</PdfLabel>
            <Text style={{ ...styles.partyName, color: ctx.template.accent, marginTop: 12 }}>
              {ctx.invoice.businessName || "-"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <PdfLabel ctx={ctx}>Balance due</PdfLabel>
            <Text style={{ ...styles.bigTotal, color: ctx.template.accent, marginTop: 10 }}>
              {formatMoney(ctx.total, ctx.invoice.currency)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: pdfBorderColor(ctx.template.id),
          }}
        >
          {[
            ["Invoice no", ctx.invoice.invoiceNumber || "-"],
            ["Issued", ctx.invoice.issueDate || "-"],
            ["Due", ctx.invoice.dueDate || "-"],
            ["Status", ctx.invoice.status || "-"],
          ].map(([label, value], index) => (
            <View key={`${label}-${index}`} style={{ flex: 1 }}>
              <PdfLabel ctx={ctx}>{label}</PdfLabel>
              <Text style={{ ...styles.smallMeta, marginTop: 7 }}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingTop: 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfPartyBlock
          ctx={ctx}
          label="Supplier"
          name={ctx.invoice.businessName}
          lines={[
            ...splitLines(ctx.invoice.businessAddress),
            ctx.invoice.businessEmail || "",
            ctx.invoice.businessPhone || "",
          ].filter(Boolean)}
        />
        <View style={{ width: 26 }} />
        <PdfPartyBlock
          ctx={ctx}
          label="Account billed"
          name={ctx.invoice.clientName}
          lines={[ctx.invoice.clientEmail || "", ...splitLines(ctx.invoice.clientAddress)].filter(
            Boolean
          )}
        />
      </View>

      <PdfLineTable ctx={ctx} />

      <View
        style={{
          flexDirection: "row",
          paddingTop: 22,
          borderTopWidth: 1,
          borderTopColor: pdfBorderColor(ctx.template.id),
        }}
      >
        <PdfSupport ctx={ctx} signatureFirst />
        <View style={{ width: 22 }} />
        <View
          style={{
            flex: 0.85,
            paddingLeft: 20,
            borderLeftWidth: 1,
            borderLeftColor: pdfBorderColor(ctx.template.id),
          }}
        >
          <PdfSummary ctx={ctx} heading="Balance summary" />
        </View>
      </View>
    </>
  );
}

function InvoiceDocument({ invoice, items }: InvoicePayload) {
  const template = getInvoiceTemplate(invoice.template);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(invoice, items);
  const ctx: PdfContext = {
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
    <Document
      title={`Invoice ${invoice.invoiceNumber || ""}`}
      author={invoice.businessName || "Invoice Generator"}
      subject="Client invoice"
      creator="Invoice Generator"
      producer="Invoice Generator"
    >
      <Page
        size="A4"
        style={{
          ...styles.page,
          backgroundColor: template.pageTone,
        }}
      >
        {content}
      </Page>
    </Document>
  );
}

const renderInvoicePdf = async (payload: InvoicePayload) =>
  renderToBuffer(<InvoiceDocument {...payload} />);

export { renderInvoicePdf };
export type { InvoicePayload };
