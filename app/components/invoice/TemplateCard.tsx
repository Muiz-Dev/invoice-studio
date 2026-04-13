"use client";

import { useRouter } from "next/navigation";
import type { InvoiceTemplateMeta } from "@/lib/invoice-data";

type TemplateCardProps = {
  template: InvoiceTemplateMeta;
};

function MiniPreview({ template }: { template: InvoiceTemplateMeta }) {
  const shellClass = `border px-4 py-4 ${template.previewToneClass} ${template.previewLineClass}`;

  switch (template.id) {
    case "editorial":
      return (
        <div className={shellClass}>
          <div className="text-[0.6rem] uppercase tracking-[0.28em] text-stone-400">
            Invoice
          </div>
          <div
            className={`mt-3 text-lg font-serif tracking-[-0.04em] ${template.previewHeadingClass}`}
          >
            INV-2045-07
          </div>
          <div className={`mt-2 text-xs ${template.previewBodyClass}`}>
            Boutique design retainer
          </div>
          <div className={`mt-5 grid grid-cols-2 gap-4 border-t pt-4 ${template.previewLineClass}`}>
            <div>
              <div className={`text-xs ${template.previewBodyClass}`}>Issued</div>
              <div className={`mt-2 text-sm ${template.previewHeadingClass}`}>Apr 13</div>
            </div>
            <div>
              <div className={`text-xs ${template.previewBodyClass}`}>Total</div>
              <div className={`mt-2 text-sm ${template.previewHeadingClass}`}>$4,250</div>
            </div>
          </div>
        </div>
      );
    case "modern":
      return (
        <div className={shellClass}>
          <div className={`h-1.5 w-20 ${template.previewBandClass}`} />
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <div className={`text-base font-semibold tracking-[-0.04em] ${template.previewHeadingClass}`}>
                INV-2045-07
              </div>
              <div className={`mt-2 text-xs ${template.previewBodyClass}`}>
                Strategy sprint
              </div>
            </div>
            <div className={`text-sm ${template.previewHeadingClass}`}>$4,250</div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div className={`border-l pl-3 ${template.previewLineClass}`}>
              <div className={template.previewBodyClass}>Issued</div>
              <div className={`mt-2 ${template.previewHeadingClass}`}>Apr 13</div>
            </div>
            <div className={`border-l pl-3 ${template.previewLineClass}`}>
              <div className={template.previewBodyClass}>Due</div>
              <div className={`mt-2 ${template.previewHeadingClass}`}>Apr 27</div>
            </div>
          </div>
        </div>
      );
    case "warm":
      return (
        <div className={shellClass}>
          <div className={`text-sm font-semibold tracking-[-0.03em] ${template.previewHeadingClass}`}>
            Mac Dev Studio
          </div>
          <div className={`mt-3 text-lg font-semibold tracking-[-0.05em] ${template.previewHeadingClass}`}>
            INV-2045-07
          </div>
          <div className={`mt-2 text-xs ${template.previewBodyClass}`}>
            Friendly service billing
          </div>
          <div className={`mt-5 border-t pt-4 ${template.previewLineClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={template.previewBodyClass}>Bill to</span>
              <span className={template.previewHeadingClass}>Atlas Team</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={template.previewBodyClass}>Due</span>
              <span className={template.previewHeadingClass}>$4,250</span>
            </div>
          </div>
        </div>
      );
    case "contractor":
      return (
        <div className={`${shellClass} border-t-4`} style={{ borderTopColor: template.accent }}>
          <div className="flex items-start justify-between gap-3">
            <div className={`text-base font-semibold tracking-[-0.04em] ${template.previewHeadingClass}`}>
              INV-2045-07
            </div>
            <div className={`text-xs ${template.previewBodyClass}`}>Sent</div>
          </div>
          <div className={`mt-4 grid grid-cols-2 gap-3 border-y py-3 text-xs ${template.previewLineClass}`}>
            <div>
              <div className={template.previewBodyClass}>Issued</div>
              <div className={`mt-2 ${template.previewHeadingClass}`}>Apr 13</div>
            </div>
            <div>
              <div className={template.previewBodyClass}>Balance</div>
              <div className={`mt-2 ${template.previewHeadingClass}`}>$4,250</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 text-xs">
            <div className={template.previewHeadingClass}>Site installation</div>
            <div className={template.previewBodyClass}>$2,800</div>
          </div>
        </div>
      );
    case "statement":
      return (
        <div className={shellClass}>
          <div className="flex items-end justify-between gap-3">
            <div className={`text-sm font-semibold tracking-[-0.03em] ${template.previewHeadingClass}`}>
              Statement invoice
            </div>
            <div className={`text-base font-semibold tracking-[-0.04em] ${template.previewHeadingClass}`}>
              $4,250
            </div>
          </div>
          <div className={`mt-4 grid grid-cols-4 gap-2 border-t pt-4 text-[0.62rem] ${template.previewLineClass}`}>
            <div>
              <div className={template.previewBodyClass}>No</div>
              <div className={`mt-1 ${template.previewHeadingClass}`}>2045</div>
            </div>
            <div>
              <div className={template.previewBodyClass}>Issued</div>
              <div className={`mt-1 ${template.previewHeadingClass}`}>Apr 13</div>
            </div>
            <div>
              <div className={template.previewBodyClass}>Due</div>
              <div className={`mt-1 ${template.previewHeadingClass}`}>Apr 27</div>
            </div>
            <div>
              <div className={template.previewBodyClass}>Status</div>
              <div className={`mt-1 ${template.previewHeadingClass}`}>Sent</div>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className={shellClass}>
          <div className={`h-1.5 w-16 ${template.previewBandClass}`} />
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <div className={`text-sm font-semibold ${template.previewHeadingClass}`}>
                INV-2045-07
              </div>
              <div className={`mt-2 text-xs ${template.previewBodyClass}`}>
                Strategy retainer
              </div>
            </div>
            <div className={`text-sm ${template.previewHeadingClass}`}>$4,250</div>
          </div>
          <div className={`mt-5 border-t pt-4 ${template.previewLineClass}`}>
            <div className="grid grid-cols-[1fr_auto] gap-3 text-xs">
              <div className={template.previewHeadingClass}>Design systems support</div>
              <div className={template.previewBodyClass}>$1,450</div>
            </div>
          </div>
        </div>
      );
  }
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/studio?template=${template.id}`)}
      className="group flex h-full flex-col justify-between border border-black/10 bg-white px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_22px_40px_rgba(15,12,8,0.08)]"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.32em] text-stone-500">
              {template.mood}
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-stone-950">
              {template.name}
            </h3>
          </div>
          <span className="text-[0.62rem] uppercase tracking-[0.28em] text-stone-400">
            {template.density}
          </span>
        </div>

        <p className="mt-3 max-w-sm text-sm leading-7 text-stone-600">
          {template.tagline}
        </p>
      </div>

      <div className="mt-8">
        <MiniPreview template={template} />

        <div className="mt-4 flex flex-wrap gap-2">
          {template.fit.map((item) => (
            <span
              key={item}
              className="text-[0.62rem] uppercase tracking-[0.24em] text-stone-400"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
