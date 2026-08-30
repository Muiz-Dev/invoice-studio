export type InvoiceTemplateId =
  | "ledger"
  | "editorial"
  | "modern"
  | "warm"
  | "contractor"
  | "statement";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceDraft = {
  status: string;
  currency: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessTin: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  issueDate: string;
  serviceDate: string;
  dueDate: string;
  paidDate: string;
  notes: string;
  showNotes: boolean;
  paymentDetails: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  showPaymentDetails: boolean;
  paymentReference: string;
  signatureName: string;
  signatureTitle: string;
  signatureDataUrl: string;
  showSignature: boolean;
  template: InvoiceTemplateId;
  taxRate: number;
};

export type InvoicePayload = {
  invoice: InvoiceDraft;
  items: InvoiceItem[];
};

export type InvoiceTemplateMeta = {
  id: InvoiceTemplateId;
  name: string;
  tagline: string;
  mood: string;
  density: string;
  fit: string[];
  accent: string;
  accentSoft: string;
  labelTone: string;
  pageTone: string;
  previewBandClass: string;
  previewToneClass: string;
  previewLineClass: string;
  previewHeadingClass: string;
  previewBodyClass: string;
  pdfFamily: "minimal" | "editorial" | "modern" | "utility";
};

export const STORAGE_KEY = "invoice-draft-v2";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const addDaysIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const createItem = (overrides?: Partial<InvoiceItem>): InvoiceItem => ({
  id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: "New service or deliverable",
  quantity: 1,
  rate: 0,
  ...overrides,
});

export const buildDefaultInvoice = (): InvoiceDraft => ({
  status: "Draft",
  currency: "NGN",
  businessName: "Mac Dev Studio",
  businessEmail: "hello@macdev.studio",
  businessPhone: "+234 801 234 5678",
  businessAddress: "12 Commercial Avenue, Yaba, Lagos",
  businessTin: "10293847-0001",
  clientName: "Atlas Product Team",
  clientEmail: "accounts@atlas.io",
  clientAddress: "Victoria Island, Lagos",
  invoiceNumber: "INV-2026-004",
  issueDate: todayIso(),
  dueDate: addDaysIso(14),
  serviceDate: todayIso(),
  paidDate: todayIso(),
  notes:
    "Thank you for your business. Payment is due within 14 days unless agreed otherwise.",
  showNotes: true,
  bankName: "Zenith Bank",
  accountName: "Mac Dev Studio Ltd",
  accountNumber: "1012345678",
  paymentDetails: "Bank: Zenith Bank | Acc: 1012345678 | Name: Mac Dev Studio Ltd",
  showPaymentDetails: true,
  paymentReference: "",
  signatureName: "Adesanya Mac",
  signatureTitle: "Founder / Lead Engineer",
  signatureDataUrl: "",
  showSignature: true,
  template: "ledger",
  taxRate: 7.5,
});

export const buildDefaultItems = (): InvoiceItem[] => [
  createItem({
    description: "Web & Mobile App Architecture Sprint",
    quantity: 1,
    rate: 1500000,
  }),
  createItem({
    description: "UI/UX Design & Prototyping",
    quantity: 1,
    rate: 750000,
  }),
  createItem({
    description: "API Integration & Cloud Deployment",
    quantity: 1,
    rate: 500000,
  }),
];

export const invoiceTemplates: InvoiceTemplateMeta[] = [
  {
    id: "ledger",
    name: "Minimal Ledger",
    tagline: "A clean professional invoice with quiet authority.",
    mood: "Measured",
    density: "Balanced",
    fit: ["Consultants", "Agencies", "Freelancers"],
    accent: "#171717",
    accentSoft: "#f5f5f4",
    labelTone: "#6b7280",
    pageTone: "#fffdf8",
    previewBandClass: "bg-stone-950",
    previewToneClass: "bg-stone-50",
    previewLineClass: "border-stone-300",
    previewHeadingClass: "text-stone-950",
    previewBodyClass: "text-stone-600",
    pdfFamily: "minimal",
  },
  {
    id: "editorial",
    name: "Editorial Serif",
    tagline: "Premium spacing and type-led hierarchy for boutique work.",
    mood: "Refined",
    density: "Airy",
    fit: ["Studios", "Architects", "Luxury services"],
    accent: "#1f2937",
    accentSoft: "#faf7f0",
    labelTone: "#7c6f64",
    pageTone: "#fffaf4",
    previewBandClass: "bg-neutral-900",
    previewToneClass: "bg-[#faf7f0]",
    previewLineClass: "border-[#cfc3b2]",
    previewHeadingClass: "text-neutral-950",
    previewBodyClass: "text-[#6e6558]",
    pdfFamily: "editorial",
  },
  {
    id: "modern",
    name: "Studio Modern",
    tagline: "Bold, current, and built for design-forward businesses.",
    mood: "Confident",
    density: "Balanced",
    fit: ["Brand studios", "Product teams", "Creators"],
    accent: "#0f172a",
    accentSoft: "#eff6ff",
    labelTone: "#475569",
    pageTone: "#f8fbff",
    previewBandClass: "bg-sky-600",
    previewToneClass: "bg-sky-50",
    previewLineClass: "border-sky-200",
    previewHeadingClass: "text-slate-950",
    previewBodyClass: "text-slate-600",
    pdfFamily: "modern",
  },
  {
    id: "warm",
    name: "Warm Service",
    tagline: "A softer tone for service businesses with human warmth.",
    mood: "Approachable",
    density: "Breathing room",
    fit: ["Coaches", "Wellness", "Home services"],
    accent: "#92400e",
    accentSoft: "#fffbeb",
    labelTone: "#a16207",
    pageTone: "#fffdf6",
    previewBandClass: "bg-amber-500",
    previewToneClass: "bg-amber-50",
    previewLineClass: "border-amber-200",
    previewHeadingClass: "text-stone-950",
    previewBodyClass: "text-stone-600",
    pdfFamily: "modern",
  },
  {
    id: "contractor",
    name: "Contractor Utility",
    tagline: "Structured and dependable for operational billing.",
    mood: "Practical",
    density: "Structured",
    fit: ["Contractors", "Installers", "Maintenance teams"],
    accent: "#1e293b",
    accentSoft: "#f8fafc",
    labelTone: "#64748b",
    pageTone: "#f8fafc",
    previewBandClass: "bg-slate-700",
    previewToneClass: "bg-slate-50",
    previewLineClass: "border-slate-300",
    previewHeadingClass: "text-slate-950",
    previewBodyClass: "text-slate-600",
    pdfFamily: "utility",
  },
  {
    id: "statement",
    name: "Statement Balance",
    tagline: "Restrained and balance-led for recurring or retainer billing.",
    mood: "Calm",
    density: "Disciplined",
    fit: ["Advisory", "Recurring billing", "Retainers"],
    accent: "#111827",
    accentSoft: "#f3f4f6",
    labelTone: "#6b7280",
    pageTone: "#fbfbfb",
    previewBandClass: "bg-neutral-800",
    previewToneClass: "bg-neutral-100",
    previewLineClass: "border-neutral-300",
    previewHeadingClass: "text-neutral-950",
    previewBodyClass: "text-neutral-600",
    pdfFamily: "minimal",
  },
];

export const getInvoiceTemplate = (id?: InvoiceTemplateId) =>
  invoiceTemplates.find((template) => template.id === id) ?? invoiceTemplates[0];

export const sanitizeItem = (item: Partial<InvoiceItem>): InvoiceItem => ({
  id: item.id ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: item.description ?? "New service or deliverable",
  quantity: Number(item.quantity ?? 0) || 0,
  rate: Number(item.rate ?? 0) || 0,
});

export const formatBankDetails = (invoice: Partial<InvoiceDraft>) => {
  if (invoice.bankName || invoice.accountName || invoice.accountNumber) {
    const parts = [];
    if (invoice.bankName) parts.push(`Bank: ${invoice.bankName}`);
    if (invoice.accountName) parts.push(`Account Name: ${invoice.accountName}`);
    if (invoice.accountNumber) parts.push(`Account No: ${invoice.accountNumber}`);
    return parts.join("\n");
  }
  return invoice.paymentDetails || "";
};

export const hydrateInvoiceDraft = (
  parsed?: Partial<InvoiceDraft>
): InvoiceDraft => {
  const defaults = buildDefaultInvoice();
  return {
    ...defaults,
    ...parsed,
    businessTin: parsed?.businessTin ?? defaults.businessTin,
    bankName: parsed?.bankName ?? defaults.bankName,
    accountName: parsed?.accountName ?? defaults.accountName,
    accountNumber: parsed?.accountNumber ?? defaults.accountNumber,
    taxRate: parsed?.taxRate !== undefined ? Number(parsed.taxRate) || 0 : defaults.taxRate,
    paymentDetails: parsed?.paymentDetails ?? defaults.paymentDetails,
    paymentReference: parsed?.paymentReference ?? defaults.paymentReference,
    notes: parsed?.notes ?? defaults.notes,
    showPaymentDetails:
      parsed?.showPaymentDetails ?? defaults.showPaymentDetails,
    showNotes: parsed?.showNotes ?? defaults.showNotes,
    showSignature: parsed?.showSignature ?? defaults.showSignature,
    signatureName: parsed?.signatureName ?? defaults.signatureName,
    signatureTitle: parsed?.signatureTitle ?? defaults.signatureTitle,
    signatureDataUrl: parsed?.signatureDataUrl ?? defaults.signatureDataUrl,
    template: (parsed?.template as InvoiceTemplateId | undefined) ?? defaults.template,
    serviceDate: parsed?.serviceDate ?? defaults.serviceDate,
    paidDate: parsed?.paidDate ?? defaults.paidDate,
  };
};

export const formatMoney = (value: number, currency?: string) => {
  const safeCurrency = currency || "NGN";
  try {
    if (safeCurrency === "NGN") {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    const symbol = safeCurrency === "NGN" ? "₦" : `${safeCurrency} `;
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

export const computeInvoiceTotals = (invoice: InvoiceDraft, items: InvoiceItem[]) => {
  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.rate,
    0
  );
  const taxAmount = subtotal * ((invoice.taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
  };
};
