"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Add,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CropOutlined,
  DeleteOutlined,
  EditOutlined,
  PrintOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";
import Cropper, { type ReactCropperElement } from "react-cropper";
import ConfirmModal from "./components/ConfirmModal";
import Toast, { type ToastState } from "./components/Toast";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

type TemplateId = "classic" | "linen" | "slate";

type ValidationErrors = {
  businessName?: string;
  clientName?: string;
  invoiceNumber?: string;
  paidDate?: string;
  lineItems?: string;
  items?: Record<string, string>;
};

const STORAGE_KEY = "invoice-draft-v1";
const SIGNATURE_WIDTH = "clamp(140px, 40vw, 180px)";

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDaysIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const createItem = (overrides?: Partial<InvoiceItem>): InvoiceItem => ({
  id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: "New service or deliverable",
  quantity: 1,
  rate: 0,
  ...overrides,
});

const buildDefaultInvoice = () => ({
  status: "Draft",
  currency: "USD",
  businessName: "Mac Dev Studio",
  businessEmail: "hello@macdev.studio",
  businessPhone: "+234 801 000 0000",
  businessAddress: "Lagos, Nigeria",
  clientName: "Atlas Product Team",
  clientEmail: "accounts@atlas.io",
  clientAddress: "Remote, Global",
  invoiceNumber: "INV-2026-004",
  issueDate: todayIso(),
  dueDate: addDaysIso(14),
  serviceDate: todayIso(),
  paidDate: todayIso(),
  notes: "Thank you for trusting me with this work. Payment is due within 14 days.",
  showNotes: true,
  paymentDetails:
    "Bank: Zenith Bank | Account: 0123456789 | Name: Mac Dev Studio",
  showPaymentDetails: true,
  paymentReference: "",
  signatureName: "Your Name",
  signatureTitle: "Founder / Owner",
  signatureDataUrl: "",
  showSignature: true,
  template: "classic" as TemplateId,
  taxRate: 0,
});

const buildDefaultItems = () => [
  createItem({
    description: "Product strategy and delivery",
    quantity: 1,
    rate: 1200,
  }),
  createItem({
    description: "UI implementation sprint",
    quantity: 1,
    rate: 850,
  }),
  createItem({
    description: "Post-launch support",
    quantity: 2,
    rate: 150,
  }),
];

const templateOptions = [
  {
    id: "classic",
    name: "Classic",
    description: "Crisp and balanced with strong hierarchy.",
    previewBar: "bg-stone-900",
    labelClass: "text-stone-500",
    badgeClass: "border-stone-900/15 bg-stone-100 text-stone-600",
    dividerClass: "border-stone-900/10",
    previewBg: "bg-white/85",
    borderClass: "border-stone-900/10",
    totalClass: "text-stone-950",
  },
  {
    id: "linen",
    name: "Warm Linen",
    description: "Soft warmth for friendly client reads.",
    previewBar: "bg-amber-500",
    labelClass: "text-amber-700",
    badgeClass: "border-amber-200/80 bg-amber-100 text-amber-700",
    dividerClass: "border-amber-200/70",
    previewBg: "bg-amber-50/70",
    borderClass: "border-amber-200/70",
    totalClass: "text-amber-900",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Minimal, sharp, modern.",
    previewBar: "bg-slate-700",
    labelClass: "text-slate-500",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    dividerClass: "border-slate-200/80",
    previewBg: "bg-white/90",
    borderClass: "border-slate-200",
    totalClass: "text-slate-900",
  },
] as const;

const sanitizeItem = (item: Partial<InvoiceItem>): InvoiceItem => ({
  id: item.id ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  description: item.description ?? "New service or deliverable",
  quantity: Number(item.quantity ?? 0) || 0,
  rate: Number(item.rate ?? 0) || 0,
});

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const trimSignatureDataUrl = async (src: string, padding = 12) => {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const brightness = (r + g + b) / 3;
      if (a > 10 && brightness < 235) {
        hasInk = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasInk) return src;

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = trimmedWidth + padding * 2;
  out.height = trimmedHeight + padding * 2;
  const outCtx = out.getContext("2d");
  if (!outCtx) return src;
  outCtx.drawImage(
    canvas,
    minX,
    minY,
    trimmedWidth,
    trimmedHeight,
    padding,
    padding,
    trimmedWidth,
    trimmedHeight
  );
  return out.toDataURL("image/png");
};

export default function Home() {
  const [items, setItems] = useState<InvoiceItem[]>(() =>
    buildDefaultItems()
  );
  const [invoice, setInvoice] = useState(() => buildDefaultInvoice());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    tone: "info",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [signatureCropSource, setSignatureCropSource] = useState("");
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  const cropperRef = useRef<ReactCropperElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, tone: ToastState["tone"] = "info") => {
    setToast({ open: true, message, tone });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 2800);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        invoice?: Partial<ReturnType<typeof buildDefaultInvoice>>;
        items?: Partial<InvoiceItem>[];
      };
      if (parsed.invoice) {
        const defaults = buildDefaultInvoice();
        setInvoice({
          ...defaults,
          ...parsed.invoice,
          taxRate: Number(parsed.invoice.taxRate ?? defaults.taxRate) || 0,
          paymentDetails:
            parsed.invoice.paymentDetails ?? defaults.paymentDetails,
          paymentReference:
            parsed.invoice.paymentReference ?? defaults.paymentReference,
          notes: parsed.invoice.notes ?? defaults.notes,
          showPaymentDetails:
            parsed.invoice.showPaymentDetails ?? defaults.showPaymentDetails,
          showNotes: parsed.invoice.showNotes ?? defaults.showNotes,
          showSignature:
            parsed.invoice.showSignature ?? defaults.showSignature,
          signatureName:
            parsed.invoice.signatureName ?? defaults.signatureName,
          signatureTitle:
            parsed.invoice.signatureTitle ?? defaults.signatureTitle,
          signatureDataUrl:
            parsed.invoice.signatureDataUrl ?? defaults.signatureDataUrl,
          template:
            (parsed.invoice.template as TemplateId | undefined) ??
            defaults.template,
          serviceDate: parsed.invoice.serviceDate ?? defaults.serviceDate,
          paidDate: parsed.invoice.paidDate ?? defaults.paidDate,
        });
      }
      if (parsed.items?.length) {
        setItems(parsed.items.map((item) => sanitizeItem(item)));
      }
    } catch {
      // Ignore corrupted drafts.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ invoice, items })
      );
      setLastSaved(new Date().toLocaleTimeString());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [invoice, items]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency,
      }),
    [invoice.currency]
  );

  const activeTemplate =
    templateOptions.find((option) => option.id === invoice.template) ??
    templateOptions[0];

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => total + item.quantity * item.rate, 0),
    [items]
  );

  const taxAmount = useMemo(
    () => subtotal * (invoice.taxRate / 100),
    [subtotal, invoice.taxRate]
  );

  const total = subtotal + taxAmount;

  const clearFieldError = (field: keyof ValidationErrors) => {
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  };

  const clearItemError = (id: string) => {
    setValidationErrors((current) => {
      if (!current.items?.[id]) return current;
      const nextItems = { ...current.items };
      delete nextItems[id];
      if (Object.keys(nextItems).length === 0) {
        const { items: _removedItems, lineItems: _removedLine, ...rest } =
          current;
        return rest;
      }
      return {
        ...current,
        items: nextItems,
      };
    });
  };

  const validateInvoice = () => {
    const errors: ValidationErrors = {};
    if (!invoice.businessName.trim()) {
      errors.businessName = "Business name is required.";
    }
    if (!invoice.clientName.trim()) {
      errors.clientName = "Client name is required.";
    }
    if (!invoice.invoiceNumber.trim()) {
      errors.invoiceNumber = "Invoice number is required.";
    }
    if (invoice.status === "Paid" && !invoice.paidDate) {
      errors.paidDate = "Paid date is required for paid invoices.";
    }
    const itemErrors: Record<string, string> = {};
    items.forEach((item) => {
      if (!item.description.trim()) {
        itemErrors[item.id] = "Add a description.";
      }
    });
    if (Object.keys(itemErrors).length > 0) {
      errors.items = itemErrors;
      errors.lineItems = "Add a description for each line item.";
    }
    setValidationErrors(errors);
    return errors;
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    if (patch.description !== undefined) {
      if (String(patch.description).trim()) {
        clearItemError(id);
      }
    }
  };

  const removeItem = (id: string) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id)
    );
  };

  const confirmRemoveItem = () => {
    if (!pendingRemoveId) return;
    removeItem(pendingRemoveId);
    setPendingRemoveId(null);
    showToast("Line item removed", "warning");
  };

  const handleSignatureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureMode("upload");
      setSignatureCropSource(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureRemove = () => {
    setInvoice((current) => ({ ...current, signatureDataUrl: "" }));
    setSignatureCropSource("");
    showToast("Signature removed", "warning");
  };

  const handleSignatureDrawSave = async () => {
    const pad = signaturePadRef.current;
    if (!pad) return;
    if (pad.isEmpty()) {
      showToast("Draw your signature first", "warning");
      return;
    }
    const trimmed = pad.getTrimmedCanvas().toDataURL("image/png");
    const normalized = await trimSignatureDataUrl(trimmed);
    setInvoice((current) => ({
      ...current,
      signatureDataUrl: normalized,
    }));
    showToast("Signature saved", "success");
  };

  const handleSignatureDrawClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleSignatureCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const cropped = cropper.getCroppedCanvas().toDataURL("image/png");
    const normalized = await trimSignatureDataUrl(cropped);
    setInvoice((current) => ({
      ...current,
      signatureDataUrl: normalized,
    }));
    showToast("Signature applied", "success");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      const errors = validateInvoice();
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the highlighted fields", "warning");
        return;
      }
      const previousTitle = document.title;
      document.title = `invoice-${invoice.invoiceNumber || "draft"}`;
      window.print();
      window.setTimeout(() => {
        document.title = previousTitle;
      }, 500);
    }
  };

  const handleDownloadPdf = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    try {
      const errors = validateInvoice();
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the highlighted fields", "warning");
        return;
      }
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, items }),
      });
      if (!response.ok) {
        throw new Error("PDF failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("PDF ready to download", "success");
    } catch {
      showToast("PDF failed. Run: npx playwright install", "warning");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleGenerateInvoiceNumber = () => {
    const baseDate = invoice.issueDate || todayIso();
    const compact = baseDate.replaceAll("-", "");
    let seq = 1;
    if (typeof window !== "undefined") {
      const key = `invoice-seq-${compact}`;
      const prev = Number(window.localStorage.getItem(key) ?? "0");
      seq = Number.isFinite(prev) ? prev + 1 : 1;
      window.localStorage.setItem(key, String(seq));
    }
    const nextNumber = `INV-${compact}-${String(seq).padStart(3, "0")}`;
    setInvoice((current) => ({ ...current, invoiceNumber: nextNumber }));
    showToast("Invoice number generated", "success");
  };

  const handleReset = () => {
    setInvoice(buildDefaultInvoice());
    setItems(buildDefaultItems());
    setLastSaved(null);
    setSignatureMode("draw");
    setSignatureCropSource("");
    signaturePadRef.current?.clear();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    showToast("Draft reset", "info");
  };

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff5dc_0%,#fff9ef_34%,#f4efe2_70%,#ece6d8_100%)] px-4 py-6 text-stone-900 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
          <header className="no-print flex flex-col gap-3 rounded-[1.5rem] border border-stone-900/10 bg-white/80 px-4 py-4 shadow-[0_25px_60px_rgba(60,45,25,0.08)] backdrop-blur sm:gap-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-stone-500 sm:text-xs">
                  Invoice Studio
                </p>
                <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-2xl lg:text-3xl">
                  Create a clean invoice in minutes
                </h1>
                {lastSaved ? (
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.24em] text-stone-400 sm:text-xs">
                    Autosaved at {lastSaved}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Quick browser print"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/20 bg-stone-900 px-4 py-2 text-xs font-semibold text-stone-50 shadow-[0_10px_20px_rgba(15,10,5,0.15)] transition hover:bg-stone-800 sm:px-5 sm:text-sm"
                >
                  <PrintOutlined fontSize="small" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  title="Server-rendered PDF download"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/20 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-[0_10px_20px_rgba(15,10,5,0.05)] transition hover:border-stone-900/40 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
                >
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-full border border-stone-900/20 bg-white px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-stone-600 transition hover:bg-stone-100 sm:px-4 sm:text-xs"
                >
                  Reset sample
                </button>
                <span className="inline-flex items-center rounded-full border border-stone-900/10 bg-stone-100 px-3 py-2 text-[0.6rem] uppercase tracking-[0.28em] text-stone-500 sm:px-4 sm:text-xs">
                  Status: {invoice.status}
                </span>
              </div>
          </div>
          <p className="text-sm leading-7 text-stone-600">
            Fill the invoice details on the left and watch the preview update on
            the right. When you are ready, hit print to save a PDF.
          </p>
          </header>

          <div className="no-print flex items-center justify-between gap-2 rounded-full border border-stone-900/10 bg-white/80 px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-stone-500 shadow-[0_12px_30px_rgba(60,45,25,0.06)] sm:px-4 sm:text-xs md:hidden">
            <button
              type="button"
              onClick={() => setMobileView("form")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 transition ${
                mobileView === "form"
                  ? "bg-stone-900 text-stone-50"
                  : "text-stone-500"
              }`}
            >
              <EditOutlined fontSize="small" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileView("preview")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 transition ${
                mobileView === "preview"
                  ? "bg-stone-900 text-stone-50"
                  : "text-stone-500"
              }`}
            >
              <VisibilityOutlined fontSize="small" />
              Preview
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <section
            className={`no-print space-y-5 rounded-[2rem] border border-stone-900/10 bg-white/80 p-4 shadow-[0_30px_80px_rgba(60,45,25,0.08)] backdrop-blur sm:space-y-6 sm:p-6 ${
              mobileView === "preview" ? "hidden md:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900 sm:text-xl">
                Invoice details
              </h2>
              <select
                className="rounded-full border border-stone-900/20 bg-white px-3 py-2 text-xs uppercase tracking-[0.24em] text-stone-600"
                value={invoice.status}
                onChange={(event) =>
                  setInvoice((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option>Draft</option>
                <option>Sent</option>
                <option>Paid</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900">
                  Templates
                </h3>
                <span className="text-xs uppercase tracking-[0.24em] text-stone-400">
                  Pick a style
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templateOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setInvoice((current) => ({
                        ...current,
                        template: option.id,
                      }))
                    }
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      invoice.template === option.id
                        ? "border-stone-900/40 bg-stone-900 text-stone-50 shadow-[0_12px_30px_rgba(15,10,5,0.12)]"
                        : "border-stone-900/10 bg-white text-stone-700 hover:border-stone-900/25"
                    }`}
                  >
                    <div className={`h-2 w-full rounded-full ${option.previewBar}`} />
                    <p className="mt-3 text-sm font-semibold">{option.name}</p>
                    <p
                      className={`mt-1 text-xs ${
                        invoice.template === option.id
                          ? "text-stone-200"
                          : "text-stone-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Business name
                <input
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 ${
                    validationErrors.businessName
                      ? "border-rose-400"
                      : "border-stone-900/15"
                  }`}
                  value={invoice.businessName}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      businessName: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (invoice.businessName.trim()) {
                      clearFieldError("businessName");
                    }
                  }}
                />
                {validationErrors.businessName ? (
                  <p className="text-xs text-rose-600">
                    {validationErrors.businessName}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Business email
                <input
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.businessEmail}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      businessEmail: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Business phone
                <input
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.businessPhone}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      businessPhone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Business address
                <textarea
                  rows={2}
                  className="w-full resize-y rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.businessAddress}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      businessAddress: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Client name
                <input
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 ${
                    validationErrors.clientName
                      ? "border-rose-400"
                      : "border-stone-900/15"
                  }`}
                  value={invoice.clientName}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      clientName: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (invoice.clientName.trim()) {
                      clearFieldError("clientName");
                    }
                  }}
                />
                {validationErrors.clientName ? (
                  <p className="text-xs text-rose-600">
                    {validationErrors.clientName}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Client email
                <input
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.clientEmail}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      clientEmail: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                Client address or notes
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.clientAddress}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      clientAddress: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Invoice number
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`min-w-[180px] flex-1 rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 ${
                      validationErrors.invoiceNumber
                        ? "border-rose-400"
                        : "border-stone-900/15"
                    }`}
                    value={invoice.invoiceNumber}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        invoiceNumber: event.target.value,
                      }))
                    }
                    onBlur={() => {
                      if (invoice.invoiceNumber.trim()) {
                        clearFieldError("invoiceNumber");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateInvoiceNumber}
                    className="rounded-full border border-stone-900/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 transition hover:border-stone-900/40"
                  >
                    Auto
                  </button>
                </div>
                {validationErrors.invoiceNumber ? (
                  <p className="text-xs text-rose-600">
                    {validationErrors.invoiceNumber}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Currency
                <select
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.currency}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                >
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Issue date
                <input
                  type="date"
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.issueDate}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      issueDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Service date
                <input
                  type="date"
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.serviceDate}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      serviceDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Due date
                <input
                  type="date"
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.dueDate}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Tax rate (%)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                  value={invoice.taxRate}
                  onChange={(event) =>
                    setInvoice((current) => ({
                      ...current,
                      taxRate: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              {invoice.status === "Paid" ? (
                <>
                  <label className="space-y-2 text-sm font-medium text-stone-700">
                    Paid date
                    <input
                      type="date"
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 ${
                        validationErrors.paidDate
                          ? "border-rose-400"
                          : "border-stone-900/15"
                      }`}
                      value={invoice.paidDate}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          paidDate: event.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (invoice.paidDate) {
                          clearFieldError("paidDate");
                        }
                      }}
                    />
                    {validationErrors.paidDate ? (
                      <p className="text-xs text-rose-600">
                        {validationErrors.paidDate}
                      </p>
                    ) : null}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-stone-700">
                    Payment reference (optional)
                    <input
                      className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                      value={invoice.paymentReference}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          paymentReference: event.target.value,
                        }))
                      }
                    />
                  </label>
                </>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900">
                  Line items
                </h3>
                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, createItem()])}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-900/20 bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600 transition hover:bg-stone-200"
                >
                  <Add fontSize="small" />
                  Add item
                </button>
              </div>
              {validationErrors.lineItems ? (
                <p className="text-xs text-rose-600">
                  {validationErrors.lineItems}
                </p>
              ) : null}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-900/10 bg-white px-4 py-3 md:grid-cols-[1.5fr_0.6fr_0.7fr_auto]"
                  >
                    <input
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 ${
                        validationErrors.items?.[item.id]
                          ? "border-rose-400"
                          : "border-stone-900/15"
                      }`}
                      value={item.description}
                      onChange={(event) =>
                        updateItem(item.id, {
                          description: event.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantity: Number(event.target.value) || 0,
                        })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                      value={item.rate}
                      onChange={(event) =>
                        updateItem(item.id, {
                          rate: Number(event.target.value) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setPendingRemoveId(item.id)}
                      aria-label="Remove line item"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/15 text-stone-500 transition hover:border-stone-900/40 hover:text-stone-800"
                    >
                      <DeleteOutlined fontSize="small" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <details className="rounded-2xl border border-stone-900/10 bg-white px-5 py-4" open>
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.22em] text-stone-600">
                Payment & Notes
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                  Payment details
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                    value={invoice.paymentDetails}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        paymentDetails: event.target.value,
                      }))
                    }
                  />
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                    <input
                      type="checkbox"
                      checked={invoice.showPaymentDetails}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          showPaymentDetails: event.target.checked,
                        }))
                      }
                    />
                    Include payment details on the invoice
                  </span>
                </label>
                <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                  Notes
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                    value={invoice.notes}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                    <input
                      type="checkbox"
                      checked={invoice.showNotes}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          showNotes: event.target.checked,
                        }))
                      }
                    />
                    Include notes on the invoice
                  </span>
                </label>
              </div>
            </details>

            <details className="rounded-2xl border border-stone-900/10 bg-white px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.22em] text-stone-600">
                Signature
              </summary>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-stone-900">
                    Signature options
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                    <input
                      type="checkbox"
                      checked={invoice.showSignature}
                      onChange={(event) =>
                        setInvoice((current) => ({
                          ...current,
                          showSignature: event.target.checked,
                        }))
                      }
                    />
                    Include signature on invoice
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-stone-700">
                  Signature name
                  <input
                    className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                    value={invoice.signatureName}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        signatureName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-stone-700">
                  Signature title
                  <input
                    className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-900"
                    value={invoice.signatureTitle}
                    onChange={(event) =>
                      setInvoice((current) => ({
                        ...current,
                        signatureTitle: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="space-y-3 md:col-span-2">
                  <p className="text-sm font-medium text-stone-700">
                    Signature tools
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("draw")}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                        signatureMode === "draw"
                          ? "border-stone-900/30 bg-stone-900 text-stone-50"
                          : "border-stone-900/15 bg-white text-stone-600"
                      }`}
                    >
                      <EditOutlined fontSize="small" />
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode("upload")}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                        signatureMode === "upload"
                          ? "border-stone-900/30 bg-stone-900 text-stone-50"
                          : "border-stone-900/15 bg-white text-stone-600"
                      }`}
                    >
                      <CloudUploadOutlined fontSize="small" />
                      Upload
                    </button>
                  </div>

                  {signatureMode === "draw" ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-2xl border border-stone-900/15 bg-white">
                        <SignatureCanvas
                          ref={signaturePadRef}
                          penColor="#0f0b07"
                          canvasProps={{
                            className: "h-32 w-full sm:h-40",
                            width: 640,
                            height: 160,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSignatureDrawClear}
                          className="rounded-full border border-stone-900/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleSignatureDrawSave}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-900/20 bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-50"
                        >
                          <CheckCircleOutlined fontSize="small" />
                          Use signature
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="block w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.24em] file:text-stone-50"
                        onChange={handleSignatureUpload}
                      />
                      {signatureCropSource ? (
                        <div className="space-y-3">
                          <Cropper
                            ref={cropperRef}
                            src={signatureCropSource}
                            style={{ height: 240, width: "100%" }}
                            viewMode={1}
                            autoCropArea={1}
                            background={false}
                            responsive
                            guides={false}
                          />
                          <button
                            type="button"
                          onClick={handleSignatureCrop}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-900/20 bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-50"
                        >
                          <CropOutlined fontSize="small" />
                          Apply crop
                        </button>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">
                          Tip: upload a clear signature photo on a white background.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  {invoice.signatureDataUrl ? (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <img
                        src={invoice.signatureDataUrl}
                        alt="Signature preview"
                        className="h-16 rounded-lg border border-stone-900/10 bg-white object-contain px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={handleSignatureRemove}
                        className="rounded-full border border-stone-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600 transition hover:border-stone-900/40 hover:text-stone-900"
                      >
                        Remove signature
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            </details>
          </section>

          <section
            className={`print-surface preview-panel rounded-[2rem] border p-4 shadow-[0_30px_80px_rgba(60,45,25,0.08)] sm:p-6 lg:sticky lg:top-6 print:block ${activeTemplate.previewBg} ${activeTemplate.borderClass} ${
              mobileView === "form" ? "hidden md:block" : "block"
            }`}
          >
            <div
              className={`flex items-start justify-between gap-6 border-b pb-5 ${activeTemplate.dividerClass}`}
            >
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.3em] ${activeTemplate.labelClass}`}
                >
                  Invoice
                </p>
                <h2 className="mt-3 text-[clamp(1.2rem,2.3vw,1.8rem)] font-semibold tracking-[-0.03em] text-stone-950">
                  {invoice.invoiceNumber}
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Issue date: {invoice.issueDate}
                </p>
                <p className="text-sm text-stone-500">
                  Service date: {invoice.serviceDate}
                </p>
                <p className="text-sm text-stone-500">
                  Due date: {invoice.dueDate}
                </p>
                {invoice.status === "Paid" ? (
                  <p className="text-sm text-stone-500">
                    Paid on: {invoice.paidDate}
                  </p>
                ) : null}
              </div>
              <div
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.28em] ${activeTemplate.badgeClass}`}
              >
                {invoice.status}
              </div>
            </div>

            <div
              className={`grid gap-6 border-b py-5 md:grid-cols-2 ${activeTemplate.dividerClass}`}
            >
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}
                >
                  From
                </p>
                <p className="mt-3 text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold text-stone-900 break-words">
                  {invoice.businessName}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  <span className="whitespace-pre-line break-words">
                    {invoice.businessAddress}
                  </span>
                  <br />
                  {invoice.businessEmail}
                  <br />
                  {invoice.businessPhone}
                </p>
              </div>

              <div>
                <p
                  className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}
                >
                  Bill To
                </p>
                <p className="mt-3 text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold text-stone-900 break-words">
                  {invoice.clientName}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {invoice.clientEmail}
                  <br />
                  <span className="whitespace-pre-line break-words">
                    {invoice.clientAddress}
                  </span>
                </p>
              </div>
            </div>

            <div className={`space-y-3 border-b py-5 ${activeTemplate.dividerClass}`}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm"
                >
                  <p className="font-medium text-stone-800">{item.description}</p>
                  <p className="text-stone-500">x{item.quantity}</p>
                  <p className="font-semibold text-stone-900">
                    {currencyFormatter.format(item.quantity * item.rate)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 py-5 text-sm">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{currencyFormatter.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{currencyFormatter.format(taxAmount)}</span>
              </div>
              <div
                className={`flex items-center justify-between border-t pt-3 text-base font-semibold ${activeTemplate.dividerClass} ${activeTemplate.totalClass}`}
              >
                <span>Total</span>
                <span>{currencyFormatter.format(total)}</span>
              </div>
            </div>

            <div className={`space-y-4 border-t pt-5 text-sm text-stone-600 ${activeTemplate.dividerClass}`}>
              {invoice.showPaymentDetails && invoice.paymentDetails.trim() ? (
                <div>
                  <p
                    className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}
                  >
                    Payment details
                  </p>
                  <p className="whitespace-pre-line break-words">
                    {invoice.paymentDetails}
                  </p>
                </div>
              ) : null}
              {(invoice.paymentReference ?? "").trim() ? (
                <div>
                  <p
                    className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}
                  >
                    Payment reference
                  </p>
                  <p>{invoice.paymentReference}</p>
                </div>
              ) : null}
              {invoice.showNotes && invoice.notes.trim() ? (
                <div>
                  <p
                    className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}
                  >
                    Notes
                  </p>
                  <p className="whitespace-pre-line break-words">
                    {invoice.notes}
                  </p>
                </div>
              ) : null}
            </div>

            {invoice.showSignature ? (
              <div className={`mt-6 border-t pt-5 text-sm text-stone-600 ${activeTemplate.dividerClass}`}>
                <p className={`text-xs uppercase tracking-[0.24em] ${activeTemplate.labelClass}`}>
                  Authorized signature
                </p>
                <div className="mt-4 flex flex-col items-start text-left">
                  {invoice.signatureDataUrl ? (
                    <img
                      src={invoice.signatureDataUrl}
                      alt="Signature"
                      style={{ width: SIGNATURE_WIDTH }}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div
                      style={{ width: SIGNATURE_WIDTH }}
                      className="h-10 border-b border-stone-900/30"
                    />
                  )}
                  <p className="mt-3 font-semibold text-stone-900">
                    {invoice.signatureName}
                  </p>
                  <p className="text-xs text-stone-500">
                    {invoice.signatureTitle}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
        </div>
      </main>
      <ConfirmModal
        open={Boolean(pendingRemoveId)}
        title="Remove this line item?"
        description="This will delete the item from the invoice."
        confirmLabel="Remove"
        onConfirm={confirmRemoveItem}
        onCancel={() => setPendingRemoveId(null)}
      />
      <ConfirmModal
        open={confirmReset}
        title="Reset this invoice?"
        description="This will restore the default sample data."
        confirmLabel="Reset"
        onConfirm={() => {
          setConfirmReset(false);
          handleReset();
        }}
        onCancel={() => setConfirmReset(false)}
      />
      <Toast
        toast={toast}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
