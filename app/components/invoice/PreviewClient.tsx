"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EditOutlined,
  PictureAsPdfOutlined,
  PrintOutlined,
} from "@mui/icons-material";
import Toast, { type ToastState } from "../Toast";
import InvoicePreview from "./InvoicePreview";
import type { InvoicePayload } from "@/lib/invoice-data";
import {
  buildDefaultInvoice,
  buildDefaultItems,
} from "@/lib/invoice-data";
import {
  downloadInvoicePdf,
  hasStoredInvoicePayload,
  loadStoredInvoicePayload,
} from "@/lib/invoice-browser";

export default function PreviewClient() {
  const [payload, setPayload] = useState<InvoicePayload>({
    invoice: buildDefaultInvoice(),
    items: buildDefaultItems(),
  });
  const [hasDraft, setHasDraft] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    tone: "info",
  });

  useEffect(() => {
    setHasDraft(hasStoredInvoicePayload());
    setPayload(loadStoredInvoicePayload());
  }, []);

  const showToast = (message: string, tone: ToastState["tone"] = "info") => {
    setToast({ open: true, message, tone });
    window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 2800);
  };

  const handleDownloadPdf = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    try {
      await downloadInvoicePdf(payload);
      showToast("PDF ready to download", "success");
    } catch {
      showToast("PDF generation failed. Please try again.", "warning");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (!hasDraft) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#faf7ef_0%,#f3ecdf_32%,#ede3d2_100%)] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-3xl border border-black/10 bg-white/85 px-6 py-8 shadow-[0_28px_70px_rgba(18,15,10,0.08)] backdrop-blur sm:px-8">
          <p className="text-[0.68rem] uppercase tracking-[0.34em] text-stone-500">
            Preview
          </p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-stone-950">
            There is no saved invoice draft yet.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Start from the template gallery or open the studio to create a draft
            before previewing the document.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-stone-950 bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white"
            >
              Go to template gallery
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center justify-center border border-black/15 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700"
            >
              Open studio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#f5f0e6_0%,#efe8da_100%)] px-4 py-6 text-stone-950 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <header className="no-print border border-black/10 bg-white/85 px-5 py-5 shadow-[0_28px_70px_rgba(18,15,10,0.08)] backdrop-blur sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[0.68rem] uppercase tracking-[0.34em] text-stone-500">
                  Full preview
                </p>
                <h1 className="mt-3 text-[clamp(2rem,4vw,3.3rem)] font-semibold tracking-[-0.06em] text-stone-950">
                  Review the invoice as a document before export.
                </h1>
                <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
                  This view gives the invoice its own reading space. Use it to
                  check hierarchy, spacing, and document tone before printing or
                  downloading the PDF.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  <EditOutlined fontSize="small" />
                  Back to studio
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  <PrintOutlined fontSize="small" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isPdfGenerating}
                  className="inline-flex items-center gap-2 border border-stone-950 bg-stone-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PictureAsPdfOutlined fontSize="small" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>
          </header>

          <div className="print-surface">
            <InvoicePreview invoice={payload.invoice} items={payload.items} />
          </div>
        </div>
      </main>

      <Toast
        toast={toast}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
