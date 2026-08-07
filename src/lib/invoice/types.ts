export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;

  customerName: string;
  customerEmail: string;

  propertyTitle: string;
  listingId: number;
  auctionId: number;

  paymentId: string;
  paymentMethod: string;

  amount: number;
  currency: string;

  companyName: string;
  companyEmail: string;
  companyWebsite?: string;
}