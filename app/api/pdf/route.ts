import { NextRequest } from "next/server";
import { chromium } from "playwright";
import { buildInvoiceHtml, type InvoicePayload } from "@/lib/pdf-template";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as InvoicePayload;
    const html = buildInvoiceHtml(payload);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        bottom: "16mm",
        left: "16mm",
        right: "16mm",
      },
    });
    await page.close();
    await browser.close();

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
        error: "Failed to generate PDF. Ensure Playwright browsers are installed.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
