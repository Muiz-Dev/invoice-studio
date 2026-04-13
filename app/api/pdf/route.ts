import { NextRequest } from "next/server";
import { renderInvoicePdf, type InvoicePayload } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as InvoicePayload;
    const pdfBuffer = await renderInvoicePdf(payload);

    const invoiceNumber = payload.invoice?.invoiceNumber || "invoice";
    const safeName = invoiceNumber.replace(/[^a-z0-9-_]+/gi, "-");

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
