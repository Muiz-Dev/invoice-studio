"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  CropOutlined,
  DeleteOutlined,
  ExpandLess,
  ExpandMore,
  NavigateBefore,
  NavigateNext,
  PictureAsPdfOutlined,
  RestartAltOutlined,
  VisibilityOutlined,
  PercentOutlined,
} from "@mui/icons-material";
import Cropper, { type ReactCropperElement } from "react-cropper";
import SignatureCanvas from "react-signature-canvas";
import gsap from "gsap";
import ConfirmModal from "../ConfirmModal";
import Toast, { type ToastState } from "../Toast";
import {
  buildDefaultInvoice,
  buildDefaultItems,
  computeInvoiceTotals,
  createItem,
  formatMoney,
  getInvoiceTemplate,
  invoiceTemplates,
  type InvoiceItem,
  type InvoicePayload,
  type InvoiceTemplateId,
} from "@/lib/invoice-data";
import {
  clearStoredInvoicePayload,
  downloadInvoicePdf,
  loadStoredInvoicePayload,
  saveStoredInvoicePayload,
} from "@/lib/invoice-browser";

type ValidationErrors = {
  businessName?: string;
  clientName?: string;
  invoiceNumber?: string;
  paidDate?: string;
  lineItems?: string;
  items?: Record<string, string>;
};

const steps = [
  {
    id: "template",
    label: "Style",
    title: "Select Invoice Template",
  },
  {
    id: "parties",
    label: "Parties",
    title: "Business & Client Info",
  },
  {
    id: "meta",
    label: "Invoice",
    title: "Dates, Currency & VAT",
  },
  {
    id: "items",
    label: "Items",
    title: "Services & Line Items",
  },
  {
    id: "finalise",
    label: "Finalise",
    title: "Payment Details & Signature",
  },
] as const;

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

export default function StudioClient() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template") as InvoiceTemplateId | null;

  const [invoice, setInvoice] = useState(buildDefaultInvoice);
  const [items, setItems] = useState<InvoiceItem[]>(buildDefaultItems);
  const [currentStep, setCurrentStep] = useState(0);
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
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  const cropperRef = useRef<ReactCropperElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const stepContentRef = useRef<HTMLDivElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);
  const progressLineRef = useRef<HTMLDivElement | null>(null);

  const activeTemplate = getInvoiceTemplate(invoice.template);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(invoice, items);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(invoice.currency === "NGN" ? "en-NG" : "en-US", {
        style: "currency",
        currency: invoice.currency,
      }),
    [invoice.currency]
  );

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
    const stored = loadStoredInvoicePayload();
    setInvoice(stored.invoice);
    setItems(stored.items);
  }, []);

  useEffect(() => {
    if (!templateParam) return;
    setInvoice((current) => ({
      ...current,
      template: templateParam,
    }));
  }, [templateParam]);

  useEffect(() => {
    const payload: InvoicePayload = { invoice, items };
    const handle = window.setTimeout(() => {
      saveStoredInvoicePayload(payload);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [invoice, items]);

  // GSAP animation for step switching
  useEffect(() => {
    if (stepContentRef.current) {
      gsap.fromTo(
        stepContentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
    if (progressLineRef.current) {
      const percentage = ((currentStep + 1) / steps.length) * 100;
      gsap.to(progressLineRef.current, {
        width: `${percentage}%`,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [currentStep]);

  // GSAP animation for mobile drawer toggle
  useEffect(() => {
    if (mobileDrawerRef.current) {
      if (mobileDrawerOpen) {
        gsap.fromTo(
          mobileDrawerRef.current,
          { y: "100%" },
          { y: "0%", duration: 0.35, ease: "power3.out" }
        );
      }
    }
  }, [mobileDrawerOpen]);

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

  const handleDownloadPdf = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);

    try {
      const errors = validateInvoice();
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the highlighted fields", "warning");
        return;
      }
      await downloadInvoicePdf({ invoice, items });
      showToast("PDF ready for download", "success");
    } catch {
      showToast("PDF generation failed. Please try again.", "warning");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleGenerateInvoiceNumber = () => {
    const baseDate = invoice.issueDate || buildDefaultInvoice().issueDate;
    const compact = baseDate.replaceAll("-", "");
    let seq = 1;
    const key = `invoice-seq-${compact}`;
    const prev = Number(window.localStorage.getItem(key) ?? "0");
    seq = Number.isFinite(prev) ? prev + 1 : 1;
    window.localStorage.setItem(key, String(seq));

    const nextNumber = `INV-${compact}-${String(seq).padStart(3, "0")}`;
    setInvoice((current) => ({ ...current, invoiceNumber: nextNumber }));
    showToast("Invoice number generated", "success");
  };

  const handleReset = () => {
    setInvoice(buildDefaultInvoice());
    setItems(buildDefaultItems());
    setCurrentStep(0);
    setLastSaved(null);
    setSignatureMode("draw");
    setSignatureCropSource("");
    setValidationErrors({});
    signaturePadRef.current?.clear();
    clearStoredInvoicePayload();
    showToast("Draft reset", "info");
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

    if (patch.description !== undefined && String(patch.description).trim()) {
      clearItemError(id);
    }
  };

  const handleAddItem = () => {
    const newItem = createItem();
    setItems((current) => [...current, newItem]);
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

  const currentStepMeta = steps[currentStep];

  return (
    <>
      <main className="min-h-screen max-w-full overflow-x-hidden bg-stone-100 pb-24 text-stone-900 px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 min-w-0">

          {/* Top Header */}
          <header className="w-full min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Link
                  href="/"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition"
                >
                  ← Back to templates
                </Link>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  Invoice Studio
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/preview"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  <VisibilityOutlined fontSize="small" />
                  Preview
                </Link>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-stone-800 disabled:opacity-60"
                >
                  <PictureAsPdfOutlined fontSize="small" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
                >
                  <RestartAltOutlined fontSize="small" />
                  Reset
                </button>
              </div>
            </div>

            {/* Quick Metadata Pill Strip */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-stone-900">Template:</span> {activeTemplate.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-stone-900">Invoice:</span> {invoice.invoiceNumber || "INV-NEW"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-stone-900">Total:</span> {formatMoney(total, invoice.currency)}
              </span>
              <span className="ml-auto hidden text-stone-400 sm:inline">
                {lastSaved ? `Autosaved ${lastSaved}` : "Autosave enabled"}
              </span>
            </div>
          </header>

          <div className="grid gap-6 min-w-0 w-full lg:grid-cols-[minmax(0,1fr)_340px]">

            {/* Main Wizard Section */}
            <section className="min-w-0 w-full rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">

              {/* Stepper Header Navigation */}
              <div className="border-b border-stone-100 pb-5">
                <div className="relative mb-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    ref={progressLineRef}
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>

                {/* Step tabs (scrollable on mobile) */}
                <div className="no-scrollbar flex w-full max-w-full min-w-0 overflow-x-auto pb-1 gap-1.5 sm:gap-2">
                  {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "bg-stone-900 text-white shadow-sm"
                            : isDone
                            ? "bg-stone-100 text-stone-800 hover:bg-stone-200"
                            : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-stone-700 text-white"
                              : isDone
                              ? "bg-emerald-600 text-white"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span>{step.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                    {currentStepMeta.title}
                  </h2>
                  <span className="text-xs font-medium text-stone-400">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
              </div>

              {/* Animated Step Content Container */}
              <div ref={stepContentRef} className="pt-6">

                {/* STEP 1: Template Selection */}
                {currentStep === 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-stone-500">
                      Select a visual template layout for your invoice.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {invoiceTemplates.map((template) => {
                        const isSelected = invoice.template === template.id;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() =>
                              setInvoice((current) => ({
                                ...current,
                                template: template.id,
                              }))
                            }
                            className={`rounded-xl border p-4 text-left transition-all ${
                              isSelected
                                ? "border-stone-900 bg-stone-900 text-white shadow-md ring-2 ring-stone-900/20"
                                : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${
                                  isSelected ? "text-stone-300" : "text-stone-400"
                                }`}
                              >
                                {template.mood}
                              </span>
                              {isSelected && (
                                <CheckCircleOutlined className="text-emerald-400" fontSize="small" />
                              )}
                            </div>
                            <h3 className="mt-1.5 text-base font-bold">{template.name}</h3>
                            <p
                              className={`mt-1 text-xs leading-relaxed ${
                                isSelected ? "text-stone-300" : "text-stone-500"
                              }`}
                            >
                              {template.tagline}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* STEP 2: Parties Info */}
                {currentStep === 1 ? (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-stone-200/80 bg-stone-50/50 p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Biller Details (Your Business)
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold text-stone-700">
                          Business Name *
                          <input
                            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                              validationErrors.businessName ? "border-rose-400" : "border-stone-300"
                            }`}
                            value={invoice.businessName}
                            onChange={(e) => setInvoice((c) => ({ ...c, businessName: e.target.value }))}
                            onBlur={() => invoice.businessName.trim() && clearFieldError("businessName")}
                          />
                          {validationErrors.businessName && (
                            <span className="mt-0.5 text-[11px] text-rose-600">
                              {validationErrors.businessName}
                            </span>
                          )}
                        </label>

                        <label className="block text-xs font-semibold text-stone-700">
                          Tax Identification No (TIN)
                          <input
                            placeholder="e.g. 10293847-0001"
                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.businessTin || ""}
                            onChange={(e) => setInvoice((c) => ({ ...c, businessTin: e.target.value }))}
                          />
                        </label>

                        <label className="block text-xs font-semibold text-stone-700">
                          Email
                          <input
                            type="email"
                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.businessEmail}
                            onChange={(e) => setInvoice((c) => ({ ...c, businessEmail: e.target.value }))}
                          />
                        </label>

                        <label className="block text-xs font-semibold text-stone-700">
                          Phone Number
                          <input
                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.businessPhone}
                            onChange={(e) => setInvoice((c) => ({ ...c, businessPhone: e.target.value }))}
                          />
                        </label>

                        <label className="block text-xs font-semibold text-stone-700 sm:col-span-2">
                          Address
                          <textarea
                            rows={2}
                            className="mt-1 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.businessAddress}
                            onChange={(e) => setInvoice((c) => ({ ...c, businessAddress: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-lg border border-stone-200/80 bg-stone-50/50 p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Client Details (Billed To)
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold text-stone-700">
                          Client Name *
                          <input
                            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                              validationErrors.clientName ? "border-rose-400" : "border-stone-300"
                            }`}
                            value={invoice.clientName}
                            onChange={(e) => setInvoice((c) => ({ ...c, clientName: e.target.value }))}
                            onBlur={() => invoice.clientName.trim() && clearFieldError("clientName")}
                          />
                          {validationErrors.clientName && (
                            <span className="mt-0.5 text-[11px] text-rose-600">
                              {validationErrors.clientName}
                            </span>
                          )}
                        </label>

                        <label className="block text-xs font-semibold text-stone-700">
                          Client Email
                          <input
                            type="email"
                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.clientEmail}
                            onChange={(e) => setInvoice((c) => ({ ...c, clientEmail: e.target.value }))}
                          />
                        </label>

                        <label className="block text-xs font-semibold text-stone-700 sm:col-span-2">
                          Client Address
                          <textarea
                            rows={2}
                            className="mt-1 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                            value={invoice.clientAddress}
                            onChange={(e) => setInvoice((c) => ({ ...c, clientAddress: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* STEP 3: Invoice Dates, Currency & VAT */}
                {currentStep === 2 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Currency
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                        value={invoice.currency}
                        onChange={(e) => setInvoice((c) => ({ ...c, currency: e.target.value }))}
                      >
                        <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                        <option value="USD">USD ($ - US Dollar)</option>
                        <option value="GBP">GBP (£ - British Pound)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-stone-700">
                      Status
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900"
                        value={invoice.status}
                        onChange={(e) => setInvoice((c) => ({ ...c, status: e.target.value }))}
                      >
                        <option>Draft</option>
                        <option>Sent</option>
                        <option>Paid</option>
                      </select>
                    </label>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700">
                        Invoice Number *
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                            validationErrors.invoiceNumber ? "border-rose-400" : "border-stone-300"
                          }`}
                          value={invoice.invoiceNumber}
                          onChange={(e) => setInvoice((c) => ({ ...c, invoiceNumber: e.target.value }))}
                          onBlur={() => invoice.invoiceNumber.trim() && clearFieldError("invoiceNumber")}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateInvoiceNumber}
                          className="shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                        >
                          Auto Generate
                        </button>
                      </div>
                      {validationErrors.invoiceNumber && (
                        <p className="mt-0.5 text-[11px] text-rose-600">
                          {validationErrors.invoiceNumber}
                        </p>
                      )}
                    </div>

                    <label className="block text-xs font-semibold text-stone-700">
                      Issue Date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        value={invoice.issueDate}
                        onChange={(e) => setInvoice((c) => ({ ...c, issueDate: e.target.value }))}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-stone-700">
                      Due Date
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        value={invoice.dueDate}
                        onChange={(e) => setInvoice((c) => ({ ...c, dueDate: e.target.value }))}
                      />
                    </label>

                    {/* Tax & VAT Section */}
                    <div className="sm:col-span-2 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-stone-700">
                          Tax / VAT Rate (%)
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInvoice((c) => ({ ...c, taxRate: 7.5 }))}
                            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                              invoice.taxRate === 7.5
                                ? "bg-emerald-600 text-white"
                                : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <PercentOutlined style={{ fontSize: 13 }} />
                            7.5% Nigerian VAT
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoice((c) => ({ ...c, taxRate: 0 }))}
                            className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                              invoice.taxRate === 0
                                ? "bg-stone-800 text-white"
                                : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            0% (No Tax)
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        value={invoice.taxRate}
                        onChange={(e) =>
                          setInvoice((c) => ({ ...c, taxRate: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>

                    {invoice.status === "Paid" && (
                      <label className="block text-xs font-semibold text-stone-700 sm:col-span-2">
                        Paid Date *
                        <input
                          type="date"
                          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                          value={invoice.paidDate}
                          onChange={(e) => setInvoice((c) => ({ ...c, paidDate: e.target.value }))}
                        />
                      </label>
                    )}
                  </div>
                ) : null}

                {/* STEP 4: Line Items */}
                {currentStep === 3 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-500">
                        Add goods, services, or billable hours.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 shadow-sm"
                      >
                        <Add fontSize="small" /> Add Line Item
                      </button>
                    </div>

                    {validationErrors.lineItems && (
                      <p className="text-xs text-rose-600 font-medium">
                        {validationErrors.lineItems}
                      </p>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden space-y-3 md:block">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[2fr_0.6fr_1fr_1fr_auto] gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm items-center"
                        >
                          <div>
                            <input
                              placeholder="Item description"
                              className={`w-full rounded-md border px-2.5 py-1.5 text-sm text-stone-900 ${
                                validationErrors.items?.[item.id]
                                  ? "border-rose-400"
                                  : "border-stone-300"
                              }`}
                              value={item.description}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="Qty"
                              className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900 text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Rate"
                              className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(item.id, { rate: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="text-right text-sm font-semibold text-stone-900 pr-2">
                            {currencyFormatter.format(item.quantity * item.rate)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingRemoveId(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <DeleteOutlined fontSize="small" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-3 md:hidden">
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-stone-200 bg-stone-50/50 p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                            <span className="text-xs font-bold text-stone-500">
                              Item #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(item.id)}
                              className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-0.5"
                            >
                              <DeleteOutlined style={{ fontSize: 16 }} /> Delete
                            </button>
                          </div>

                          <label className="block text-xs font-medium text-stone-700">
                            Description
                            <input
                              className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-stone-900 ${
                                validationErrors.items?.[item.id]
                                  ? "border-rose-400"
                                  : "border-stone-300"
                              }`}
                              value={item.description}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-2">
                            <label className="block text-xs font-medium text-stone-700">
                              Quantity
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                                }
                              />
                            </label>

                            <label className="block text-xs font-medium text-stone-700">
                              Rate ({invoice.currency})
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                                value={item.rate}
                                onChange={(e) =>
                                  updateItem(item.id, { rate: Number(e.target.value) || 0 })
                                }
                              />
                            </label>
                          </div>

                          <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-xs font-semibold text-stone-900">
                            <span>Subtotal:</span>
                            <span className="text-sm">
                              {currencyFormatter.format(item.quantity * item.rate)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* STEP 5: Bank Payment Details & Signature */}
                {currentStep === 4 ? (
                  <div className="space-y-6">

                    {/* Structured Bank Payment Section */}
                    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                          Bank Transfer Details
                        </h3>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                          <input
                            type="checkbox"
                            className="rounded border-stone-300"
                            checked={invoice.showPaymentDetails}
                            onChange={(e) =>
                              setInvoice((c) => ({ ...c, showPaymentDetails: e.target.checked }))
                            }
                          />
                          Show on Invoice
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block text-xs font-medium text-stone-700">
                          Bank Name
                          <input
                            placeholder="e.g. Zenith Bank"
                            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                            value={invoice.bankName || ""}
                            onChange={(e) => {
                              const bName = e.target.value;
                              setInvoice((c) => ({
                                ...c,
                                bankName: bName,
                                paymentDetails: `Bank: ${bName} | Acc: ${c.accountNumber || ""} | Name: ${c.accountName || ""}`,
                              }));
                            }}
                          />
                        </label>

                        <label className="block text-xs font-medium text-stone-700">
                          Account Name
                          <input
                            placeholder="e.g. Mac Dev Studio Ltd"
                            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                            value={invoice.accountName || ""}
                            onChange={(e) => {
                              const accName = e.target.value;
                              setInvoice((c) => ({
                                ...c,
                                accountName: accName,
                                paymentDetails: `Bank: ${c.bankName || ""} | Acc: ${c.accountNumber || ""} | Name: ${accName}`,
                              }));
                            }}
                          />
                        </label>

                        <label className="block text-xs font-medium text-stone-700">
                          Account Number
                          <input
                            placeholder="e.g. 1012345678"
                            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                            value={invoice.accountNumber || ""}
                            onChange={(e) => {
                              const accNum = e.target.value;
                              setInvoice((c) => ({
                                ...c,
                                accountNumber: accNum,
                                paymentDetails: `Bank: ${c.bankName || ""} | Acc: ${accNum} | Name: ${c.accountName || ""}`,
                              }));
                            }}
                          />
                        </label>
                      </div>

                      <label className="block text-xs font-medium text-stone-700 pt-1">
                        Additional Payment Notes / Reference
                        <textarea
                          rows={2}
                          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                          value={invoice.notes}
                          onChange={(e) => setInvoice((c) => ({ ...c, notes: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Signature Section */}
                    <div className="rounded-lg border border-stone-200 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                          Authorized Signature
                        </h3>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                          <input
                            type="checkbox"
                            className="rounded border-stone-300"
                            checked={invoice.showSignature}
                            onChange={(e) =>
                              setInvoice((c) => ({ ...c, showSignature: e.target.checked }))
                            }
                          />
                          Include Signature
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-stone-700">
                          Signer Name
                          <input
                            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                            value={invoice.signatureName}
                            onChange={(e) => setInvoice((c) => ({ ...c, signatureName: e.target.value }))}
                          />
                        </label>

                        <label className="block text-xs font-medium text-stone-700">
                          Signer Title
                          <input
                            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
                            value={invoice.signatureTitle}
                            onChange={(e) => setInvoice((c) => ({ ...c, signatureTitle: e.target.value }))}
                          />
                        </label>
                      </div>

                      <div className="flex gap-2 border-t border-stone-100 pt-3">
                        <button
                          type="button"
                          onClick={() => setSignatureMode("draw")}
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                            signatureMode === "draw"
                              ? "bg-stone-900 text-white"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          Draw Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignatureMode("upload")}
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                            signatureMode === "upload"
                              ? "bg-stone-900 text-white"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          Upload Image
                        </button>
                      </div>

                      {signatureMode === "draw" ? (
                        <div className="space-y-2 min-w-0 w-full">
                          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-stone-300 bg-white">
                            <SignatureCanvas
                              ref={signaturePadRef}
                              penColor="#111827"
                              canvasProps={{
                                className: "h-28 w-full max-w-full sm:h-32",
                                width: 600,
                                height: 140,
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => signaturePadRef.current?.clear()}
                              className="rounded bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={handleSignatureDrawSave}
                              className="inline-flex items-center gap-1 rounded bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition"
                            >
                              <CheckCircleOutlined fontSize="small" /> Apply Signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            className="block w-full text-xs text-stone-500 file:mr-3 file:rounded file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                            onChange={handleSignatureUpload}
                          />
                          {signatureCropSource && (
                            <div className="space-y-2 pt-2">
                              <Cropper
                                ref={cropperRef}
                                src={signatureCropSource}
                                style={{ height: 180, width: "100%" }}
                                viewMode={1}
                                autoCropArea={1}
                                background={false}
                                responsive
                                guides={false}
                              />
                              <button
                                type="button"
                                onClick={handleSignatureCrop}
                                className="inline-flex items-center gap-1 rounded bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <CropOutlined fontSize="small" /> Crop & Apply
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {invoice.signatureDataUrl && (
                        <div className="flex items-center gap-3 border-t border-stone-100 pt-3">
                          <img
                            src={invoice.signatureDataUrl}
                            alt="Signature preview"
                            className="h-10 border bg-white p-1 rounded"
                          />
                          <button
                            type="button"
                            onClick={handleSignatureRemove}
                            className="text-xs text-rose-600 hover:underline font-medium"
                          >
                            Remove Signature
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Wizard Footer Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <NavigateBefore fontSize="small" /> Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentStep < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((c) => Math.min(steps.length - 1, c + 1))}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow transition hover:bg-stone-800"
                    >
                      Next <NavigateNext fontSize="small" />
                    </button>
                  ) : (
                    <Link
                      href="/preview"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-700"
                    >
                      View Preview <VisibilityOutlined fontSize="small" />
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Desktop Sidebar Summary */}
            <aside className="hidden h-fit rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:block">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Invoice Summary
                </h3>
                <p className="mt-1 text-lg font-bold text-stone-900">{activeTemplate.name}</p>
              </div>

              <div className="space-y-3 border-b border-stone-100 py-4 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Client</span>
                  <span className="font-semibold text-stone-900">{invoice.clientName || "—"}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{currencyFormatter.format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{currencyFormatter.format(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-sm font-bold text-stone-900">
                  <span>Total Due</span>
                  <span className="text-emerald-700">{formatMoney(total, invoice.currency)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Link
                  href="/preview"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-sm"
                >
                  <VisibilityOutlined fontSize="small" /> Open Full Preview
                </Link>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition shadow"
                >
                  <PictureAsPdfOutlined fontSize="small" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Expandable Summary Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold text-stone-900"
        >
          <span className="flex items-center gap-2">
            <span>Total Due:</span>
            <span className="text-sm font-extrabold text-emerald-700">
              {formatMoney(total, invoice.currency)}
            </span>
          </span>
          <span className="flex items-center gap-1 text-stone-500 font-semibold">
            {mobileDrawerOpen ? "Hide" : "Summary"}
            {mobileDrawerOpen ? <ExpandMore /> : <ExpandLess />}
          </span>
        </button>

        {mobileDrawerOpen && (
          <div ref={mobileDrawerRef} className="border-t border-stone-100 px-4 py-3 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Client:</span>
              <span className="font-semibold text-stone-900">{invoice.clientName || "—"}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>{currencyFormatter.format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax ({invoice.taxRate}%):</span>
              <span>{currencyFormatter.format(taxAmount)}</span>
            </div>
            <div className="pt-2 flex gap-2">
              <Link
                href="/preview"
                className="flex-1 py-2 text-center rounded-lg border border-stone-300 font-semibold text-stone-700"
              >
                Preview
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isPdfGenerating}
                className="flex-1 py-2 text-center rounded-lg bg-stone-900 text-white font-semibold"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingRemoveId)}
        title="Remove item?"
        description="This will remove the line item from your invoice."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!pendingRemoveId) return;
          setItems((current) =>
            current.length === 1
              ? current
              : current.filter((item) => item.id !== pendingRemoveId)
          );
          setPendingRemoveId(null);
          showToast("Item removed", "warning");
        }}
        onCancel={() => setPendingRemoveId(null)}
      />

      <ConfirmModal
        open={confirmReset}
        title="Reset invoice draft?"
        description="This will restore standard sample content."
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
