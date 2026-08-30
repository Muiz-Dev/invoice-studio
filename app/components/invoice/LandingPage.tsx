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
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">

        {/* Hero Banner */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              🇳🇬 Tailored for Nigerian Businesses & Global Billing
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Professional Invoice Studio
            </h1>
            <p className="mt-4 text-base text-stone-600 sm:text-lg">
              Create clean, compliant invoices in seconds with custom templates, 7.5% VAT presets, structured bank transfers, and instant PDF download.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-stone-800"
              >
                Create New Invoice
              </Link>
              {resumeTemplate && (
                <Link
                  href={`/studio?template=${resumeTemplate}`}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  Resume Draft
                </Link>
              )}
            </div>

            <div className="mt-10 grid gap-4 border-t border-stone-100 pt-8 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold text-stone-400">01. Choose Style</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Professional Templates</p>
                <p className="mt-0.5 text-xs text-stone-500">Pick from 6 clean document themes.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400">02. Fill Details</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Guided Interactive Editor</p>
                <p className="mt-0.5 text-xs text-stone-500">Add TIN, VAT, bank account & items.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400">03. Download</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Print or Export PDF</p>
                <p className="mt-0.5 text-xs text-stone-500">Instant PDF export with live preview.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                Invoice Templates
              </h2>
              <p className="text-xs text-stone-500">
                Choose a style that matches your business identity.
              </p>
            </div>
            <Link
              href="/preview"
              className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition"
            >
              View Active Preview
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {invoiceTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
