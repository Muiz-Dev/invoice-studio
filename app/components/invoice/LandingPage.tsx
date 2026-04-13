"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TemplateCard from "./TemplateCard";
import {
  STORAGE_KEY,
  buildDefaultInvoice,
  invoiceTemplates,
  type InvoiceTemplateId,
} from "@/lib/invoice-data";

export default function LandingPage() {
  const [resumeTemplate, setResumeTemplate] = useState<InvoiceTemplateId | null>(
    null
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        invoice?: Partial<ReturnType<typeof buildDefaultInvoice>>;
      };
      const nextTemplate = parsed.invoice?.template;
      if (nextTemplate) {
        setResumeTemplate(nextTemplate);
      } else {
        setResumeTemplate(buildDefaultInvoice().template);
      }
    } catch {
      setResumeTemplate(buildDefaultInvoice().template);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f9f5ec_0%,#f5f0e6_28%,#efe7d8_100%)] px-4 py-6 text-stone-950 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="grid gap-8 border border-black/10 bg-white/80 px-6 py-8 shadow-[0_35px_80px_rgba(18,15,10,0.08)] backdrop-blur sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-stone-500">
              Invoice Studio
            </p>
            <h1 className="mt-5 max-w-2xl text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-950">
              Build invoices like documents, not dashboards.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              Start from a real template family, move through a guided studio,
              then open a dedicated preview before printing or downloading the
              PDF.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center border border-stone-950 bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800"
              >
                Start a new invoice
              </Link>
              {resumeTemplate ? (
                <Link
                  href={`/studio?template=${resumeTemplate}`}
                  className="inline-flex items-center justify-center border border-black/15 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-stone-700 transition hover:border-black/30"
                >
                  Resume draft
                </Link>
              ) : null}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Step 01
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  Choose a template
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Pick by tone, industry fit, and layout personality.
                </p>
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Step 02
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  Fill a guided studio
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Move step by step instead of fighting a giant form wall.
                </p>
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
                  Step 03
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  Preview and export
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Open a full-page preview, then print or download the PDF.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-black/10 bg-[#fffdf8] p-5 sm:p-6">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-stone-400">
              Documentation-led rebuild
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
              The product now centers on real invoice structure.
            </p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-stone-600">
              <p>
                The new foundation is backed by in-repo research covering invoice
                anatomy, template families, PDF rendering rules, document design,
                and a product architecture plan.
              </p>
              <p>
                That research now lives in `docs/invoice-system/` and informs the
                gallery, studio, preview, and PDF layers.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.34em] text-stone-500">
                Template gallery
              </p>
              <h2 className="mt-2 text-[clamp(2rem,3.4vw,3rem)] font-semibold tracking-[-0.05em] text-stone-950">
                Choose the invoice personality before you start writing.
              </h2>
            </div>
            <Link
              href="/preview"
              className="inline-flex items-center justify-center border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 transition hover:border-black/30"
            >
              Open latest preview
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {invoiceTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
