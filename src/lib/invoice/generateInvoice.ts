import { PDFDocument } from "pdf-lib";
import { InvoiceData } from "./types";
import { buildInvoiceTemplate } from "./invoiceTemplate";

export async function generateInvoice(
  data: InvoiceData
): Promise<Uint8Array> {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();

  // Build invoice layout
  await buildInvoiceTemplate(pdfDoc, data);

  // Return PDF bytes
  return await pdfDoc.save();
}