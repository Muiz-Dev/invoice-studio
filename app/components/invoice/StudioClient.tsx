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
  CloudUploadOutlined,
  CropOutlined,
  DeleteOutlined,
  NavigateBefore,
  NavigateNext,
  PictureAsPdfOutlined,
  RestartAltOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import Cropper, { type ReactCropperElement } from "react-cropper";
import SignatureCanvas from "react-signature-canvas";
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
    label: "Template",
    title: "Choose the invoice direction before filling the details.",
  },
  {
    id: "parties",
    label: "Parties",
    title: "Define who is billing and who is being billed.",
  },
  {
    id: "meta",
    label: "Invoice",
    title: "Set dates, references, currency, and payment state.",
  },
  {
    id: "items",
    label: "Items",
    title: "Build the billed work with clean line-item detail.",
  },
  {
    id: "finalise",
    label: "Finalise",
    title: "Add payment notes, signature, and export actions.",
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
  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  const cropperRef = useRef<ReactCropperElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const activeTemplate = getInvoiceTemplate(invoice.template);
  const { subtotal, taxAmount, total } = computeInvoiceTotals(invoice, items);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
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
      setLastSaved(new Date().toLocaleTimeString());
    }, 250);

    return () => window.clearTimeout(handle);
  }, [invoice, items]);

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
      showToast("PDF ready to download", "success");
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
      <main className="min-h-screen bg-[linear-gradient(180deg,#faf7ef_0%,#f3ecdf_32%,#ede3d2_100%)] px-4 py-6 text-stone-950 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <header className="border border-black/10 bg-white/85 px-5 py-5 shadow-[0_28px_70px_rgba(18,15,10,0.08)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Link
                  href="/"
                  className="text-[0.62rem] uppercase tracking-[0.34em] text-stone-500"
                >
                  Back to template gallery
                </Link>
                <h1 className="mt-3 text-[clamp(2rem,4vw,3.3rem)] font-semibold tracking-[-0.06em] text-stone-950">
                  Invoice studio
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  Build the invoice in steps, then open a full-page preview when
                  you want to see the document in its final reading environment.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/preview"
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  <VisibilityOutlined fontSize="small" />
                  Open preview
                </Link>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  className="inline-flex items-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PictureAsPdfOutlined fontSize="small" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  <RestartAltOutlined fontSize="small" />
                  Reset draft
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-black/10 pt-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Selected template
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  {activeTemplate.name}
                </p>
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Invoice number
                </p>
                <p className="mt-2 text-sm font-medium text-stone-700">
                  {invoice.invoiceNumber || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium text-stone-700">
                  {invoice.status}
                </p>
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Autosave
                </p>
                <p className="mt-2 text-sm font-medium text-stone-700">
                  {lastSaved ? `Saved ${lastSaved}` : "Saving enabled"}
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="border border-black/10 bg-white/85 px-5 py-5 shadow-[0_28px_70px_rgba(18,15,10,0.06)] backdrop-blur sm:px-6">
              <div className="border-b border-black/10 pb-5">
                <div className="flex flex-wrap gap-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`inline-flex items-center gap-2 border px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] transition ${
                        index === currentStep
                          ? "border-stone-950 bg-stone-950 text-white"
                          : "border-black/10 bg-white text-stone-600 hover:border-black/20"
                      }`}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>{step.label}</span>
                    </button>
                  ))}
                </div>
                <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-[-0.04em] text-stone-950">
                  {currentStepMeta.title}
                </h2>
              </div>

              <div className="pt-6">
                {currentStep === 0 ? (
                  <div className="space-y-5">
                    <p className="max-w-2xl text-sm leading-7 text-stone-600">
                      Choose a template family based on tone and business fit.
                      These are real document directions, not simple color swaps.
                    </p>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {invoiceTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() =>
                            setInvoice((current) => ({
                              ...current,
                              template: template.id,
                            }))
                          }
                          className={`border px-5 py-5 text-left transition ${
                            invoice.template === template.id
                              ? "border-stone-950 bg-stone-950 text-white shadow-[0_20px_45px_rgba(15,12,8,0.18)]"
                              : "border-black/10 bg-white text-stone-950 hover:border-black/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p
                                className={`text-[0.62rem] uppercase tracking-[0.3em] ${
                                  invoice.template === template.id
                                    ? "text-stone-300"
                                    : "text-stone-400"
                                }`}
                              >
                                {template.mood}
                              </p>
                              <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em]">
                                {template.name}
                              </h3>
                            </div>
                            <span
                              className={`text-[0.62rem] uppercase tracking-[0.28em] ${
                                invoice.template === template.id
                                  ? "text-stone-300"
                                  : "text-stone-400"
                              }`}
                            >
                              {template.density}
                            </span>
                          </div>
                          <p
                            className={`mt-3 text-sm leading-7 ${
                              invoice.template === template.id
                                ? "text-stone-200"
                                : "text-stone-600"
                            }`}
                          >
                            {template.tagline}
                          </p>
                          <div className="mt-6 border border-current/10 px-4 py-4">
                            <div className={`h-1.5 w-16 ${template.previewBandClass}`} />
                            <div className="mt-4 flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">
                                  INV-2026-018
                                </div>
                                <div
                                  className={`mt-2 text-xs ${
                                    invoice.template === template.id
                                      ? "text-stone-300"
                                      : template.previewBodyClass
                                  }`}
                                >
                                  Strategy retainer
                                </div>
                              </div>
                              <div className="text-sm">$4,250</div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {template.fit.map((fit) => (
                              <span
                                key={fit}
                                className={`text-[0.62rem] uppercase tracking-[0.24em] ${
                                  invoice.template === template.id
                                    ? "text-stone-300"
                                    : "text-stone-400"
                                }`}
                              >
                                {fit}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div className="grid gap-8">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-stone-700">
                        Business name
                        <input
                          className={`w-full border bg-white px-3 py-3 text-sm text-stone-900 ${
                            validationErrors.businessName
                              ? "border-rose-400"
                              : "border-black/15"
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
                          className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                          className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                          rows={3}
                          className="w-full resize-y border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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

                    <div className="border-t border-black/10 pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-stone-700">
                          Client name
                          <input
                            className={`w-full border bg-white px-3 py-3 text-sm text-stone-900 ${
                              validationErrors.clientName
                                ? "border-rose-400"
                                : "border-black/15"
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
                            className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                            rows={4}
                            className="w-full resize-y border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                    </div>
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-stone-700">
                      Status
                      <select
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                    </label>
                    <label className="space-y-2 text-sm font-medium text-stone-700">
                      Currency
                      <select
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                    <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                      Invoice number
                      <div className="flex flex-wrap gap-2">
                        <input
                          className={`min-w-[220px] flex-1 border bg-white px-3 py-3 text-sm text-stone-900 ${
                            validationErrors.invoiceNumber
                              ? "border-rose-400"
                              : "border-black/15"
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
                          className="border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 transition hover:border-black/30"
                        >
                          Auto generate
                        </button>
                      </div>
                      {validationErrors.invoiceNumber ? (
                        <p className="text-xs text-rose-600">
                          {validationErrors.invoiceNumber}
                        </p>
                      ) : null}
                    </label>
                    <label className="space-y-2 text-sm font-medium text-stone-700">
                      Issue date
                      <input
                        type="date"
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                        className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                            className={`w-full border bg-white px-3 py-3 text-sm text-stone-900 ${
                              validationErrors.paidDate
                                ? "border-rose-400"
                                : "border-black/15"
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
                          Payment reference
                          <input
                            className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                ) : null}

                {currentStep === 3 ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm leading-7 text-stone-600">
                          Build the invoice body here. The document layout will
                          preserve these line items in the preview and PDF.
                        </p>
                        {validationErrors.lineItems ? (
                          <p className="mt-2 text-xs text-rose-600">
                            {validationErrors.lineItems}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((current) => [...current, createItem()])
                        }
                        className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                      >
                        <Add fontSize="small" />
                        Add item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="grid gap-3 border border-black/10 bg-white px-4 py-4 md:grid-cols-[1.5fr_0.6fr_0.8fr_0.9fr_auto]"
                        >
                          <label className="space-y-2 text-sm font-medium text-stone-700">
                            Description
                            <input
                              className={`w-full border bg-white px-3 py-3 text-sm text-stone-900 ${
                                validationErrors.items?.[item.id]
                                  ? "border-rose-400"
                                  : "border-black/15"
                              }`}
                              value={item.description}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  description: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-sm font-medium text-stone-700">
                            Qty
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  quantity: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-2 text-sm font-medium text-stone-700">
                            Rate
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
                              value={item.rate}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  rate: Number(event.target.value) || 0,
                                })
                              }
                            />
                          </label>
                          <div className="space-y-2 text-sm font-medium text-stone-700">
                            <p>Amount</p>
                            <div className="border border-black/10 bg-stone-50 px-3 py-3 text-sm text-stone-900">
                              {currencyFormatter.format(item.quantity * item.rate)}
                            </div>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(item.id)}
                              aria-label="Remove line item"
                              className="inline-flex h-11 w-11 items-center justify-center border border-black/15 text-stone-500 transition hover:border-black/30 hover:text-stone-900"
                            >
                              <DeleteOutlined fontSize="small" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                        Payment details
                        <textarea
                          rows={4}
                          className="w-full resize-y border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                          Include payment details in the invoice
                        </span>
                      </label>

                      <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
                        Notes
                        <textarea
                          rows={4}
                          className="w-full resize-y border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                          Include notes in the invoice
                        </span>
                      </label>
                    </div>

                    <div className="border-t border-black/10 pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-stone-950">
                            Signature
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-stone-600">
                            Add an optional signature block for a more complete
                            invoice handoff.
                          </p>
                        </div>
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
                          Include signature
                        </label>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-stone-700">
                          Signature name
                          <input
                            className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
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
                            className="w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-900"
                            value={invoice.signatureTitle}
                            onChange={(event) =>
                              setInvoice((current) => ({
                                ...current,
                                signatureTitle: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSignatureMode("draw")}
                          className={`border px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                            signatureMode === "draw"
                              ? "border-stone-950 bg-stone-950 text-white"
                              : "border-black/15 bg-white text-stone-700"
                          }`}
                        >
                          Draw
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignatureMode("upload")}
                          className={`border px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                            signatureMode === "upload"
                              ? "border-stone-950 bg-stone-950 text-white"
                              : "border-black/15 bg-white text-stone-700"
                          }`}
                        >
                          Upload
                        </button>
                      </div>

                      {signatureMode === "draw" ? (
                        <div className="mt-4 space-y-3">
                          <div className="overflow-hidden border border-black/15 bg-white">
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
                              onClick={() => signaturePadRef.current?.clear()}
                              className="border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={handleSignatureDrawSave}
                              className="inline-flex items-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white"
                            >
                              <CheckCircleOutlined fontSize="small" />
                              Use signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            className="block w-full border border-black/15 bg-white px-3 py-3 text-sm text-stone-600 file:mr-3 file:border-0 file:bg-stone-950 file:px-4 file:py-3 file:text-xs file:font-semibold file:uppercase file:tracking-[0.22em] file:text-white"
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
                                className="inline-flex items-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white"
                              >
                                <CropOutlined fontSize="small" />
                                Apply crop
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500">
                              Upload a clear signature image on a light background.
                            </p>
                          )}
                        </div>
                      )}

                      {invoice.signatureDataUrl ? (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <img
                            src={invoice.signatureDataUrl}
                            alt="Signature preview"
                            className="h-16 border border-black/10 bg-white px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={handleSignatureRemove}
                            className="border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700"
                          >
                            Remove signature
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep((current) => Math.max(0, current - 1))}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <NavigateBefore fontSize="small" />
                  Previous
                </button>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/preview"
                    className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                  >
                    <VisibilityOutlined fontSize="small" />
                    Open preview
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentStep((current) =>
                        Math.min(steps.length - 1, current + 1)
                      )
                    }
                    disabled={currentStep === steps.length - 1}
                    className="inline-flex items-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                    <NavigateNext fontSize="small" />
                  </button>
                </div>
              </div>
            </section>

            <aside className="h-fit border border-black/10 bg-white/85 px-5 py-5 shadow-[0_28px_70px_rgba(18,15,10,0.05)] backdrop-blur lg:sticky lg:top-6">
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                Draft summary
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                {activeTemplate.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {activeTemplate.tagline}
              </p>

              <div className="mt-6 space-y-4 border-t border-black/10 pt-5">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.28em] text-stone-400">
                    Client
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-800">
                    {invoice.clientName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.28em] text-stone-400">
                    Total due
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                    {formatMoney(total, invoice.currency)}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-stone-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{currencyFormatter.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span>{currencyFormatter.format(taxAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="text-[0.62rem] uppercase tracking-[0.28em] text-stone-400">
                  Current focus
                </p>
                <p className="mt-2 text-sm font-medium text-stone-800">
                  {currentStepMeta.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  {currentStepMeta.title}
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t border-black/10 pt-5">
                <Link
                  href="/preview"
                  className="inline-flex w-full items-center justify-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  <VisibilityOutlined fontSize="small" />
                  Preview document
                </Link>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PictureAsPdfOutlined fontSize="small" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <ConfirmModal
        open={Boolean(pendingRemoveId)}
        title="Remove this line item?"
        description="This will delete the item from the invoice."
        confirmLabel="Remove"
        onConfirm={() => {
          if (!pendingRemoveId) return;
          setItems((current) =>
            current.length === 1
              ? current
              : current.filter((item) => item.id !== pendingRemoveId)
          );
          setPendingRemoveId(null);
          showToast("Line item removed", "warning");
        }}
        onCancel={() => setPendingRemoveId(null)}
      />

      <ConfirmModal
        open={confirmReset}
        title="Reset this invoice?"
        description="This will restore the sample content and clear the saved draft."
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
