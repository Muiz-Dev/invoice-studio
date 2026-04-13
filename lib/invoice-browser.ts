import {
  STORAGE_KEY,
  buildDefaultInvoice,
  buildDefaultItems,
  hydrateInvoiceDraft,
  sanitizeItem,
  type InvoicePayload,
} from "./invoice-data";

export const loadStoredInvoicePayload = (): InvoicePayload => {
  const fallback = {
    invoice: buildDefaultInvoice(),
    items: buildDefaultItems(),
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as {
      invoice?: Partial<InvoicePayload["invoice"]>;
      items?: Partial<InvoicePayload["items"][number]>[];
    };

    return {
      invoice: hydrateInvoiceDraft(parsed.invoice),
      items: parsed.items?.length
        ? parsed.items.map((item) => sanitizeItem(item))
        : fallback.items,
    };
  } catch {
    return fallback;
  }
};

export const saveStoredInvoicePayload = (payload: InvoicePayload) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearStoredInvoicePayload = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const hasStoredInvoicePayload = () => {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(STORAGE_KEY));
};

export const downloadInvoicePdf = async (payload: InvoicePayload) => {
  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("PDF generation failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeNumber = payload.invoice.invoiceNumber || "invoice";

  link.href = url;
  link.download = `invoice-${safeNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
