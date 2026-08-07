import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { InvoiceData } from "./types";

export async function buildInvoiceTemplate(
    pdfDoc: PDFDocument,
    data: InvoiceData
) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Background
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
    });

    // Header
    page.drawText("IBIDS", {
        x: 50,
        y: height - 60,
        size: 24,
        font: bold,
        color: rgb(0.1, 0.3, 0.8),
    });

    page.drawText("PAYMENT INVOICE", {
        x: 50,
        y: height - 90,
        size: 18,
        font: bold,
    });

    // Invoice Info
    page.drawText(`Invoice #: ${data.invoiceNumber}`, {
        x: 50,
        y: height - 140,
        size: 11,
        font,
    });

    page.drawText(`Date: ${data.invoiceDate}`, {
        x: 50,
        y: height - 160,
        size: 11,
        font,
    });

    page.drawText("Status: PAID", {
        x: width - 140,
        y: height - 140,
        size: 11,
        font: bold,
        color: rgb(0, 0.6, 0),
    });

    // Customer
    page.drawText("Customer", {
        x: 50,
        y: height - 220,
        size: 14,
        font: bold,
    });

    page.drawText(data.customerName, {
        x: 50,
        y: height - 240,
        size: 11,
        font,
    });

    page.drawText(data.customerEmail, {
        x: 50,
        y: height - 258,
        size: 11,
        font,
    });

    // Auction
    page.drawText("Auction Details", {
        x: 50,
        y: height - 320,
        size: 14,
        font: bold,
    });

    page.drawText(`Property: ${data.propertyTitle}`, {
        x: 50,
        y: height - 340,
        size: 11,
        font,
    });

    page.drawText(`Listing ID: ${data.listingId}`, {
        x: 50,
        y: height - 358,
        size: 11,
        font,
    });

    page.drawText(`Auction ID: ${data.auctionId}`, {
        x: 50,
        y: height - 376,
        size: 11,
        font,
    });

    // Payment
    page.drawText("Payment", {
        x: 50,
        y: height - 440,
        size: 14,
        font: bold,
    });

    page.drawText(`Payment ID: ${data.paymentId}`, {
        x: 50,
        y: height - 460,
        size: 11,
        font,
    });

    page.drawText(`Method: ${data.paymentMethod}`, {
        x: 50,
        y: height - 478,
        size: 11,
        font,
    });

    page.drawText(
        `Amount: ${data.currency} ${data.amount.toFixed(2)}`,
        {
            x: 50,
            y: height - 496,
            size: 11,
            font: bold,
        }
    );

    // Footer
    page.drawLine({
        start: { x: 50, y: 70 },
        end: { x: width - 50, y: 70 },
        thickness: 1,
    });

    page.drawText("Thank you for your payment.", {
        x: 50,
        y: 45,
        size: 10,
        font,
    });

    page.drawText(
        "This is a computer-generated invoice.",
        {
            x: width - 220,
            y: 45,
            size: 10,
            font,
        }
    );
}