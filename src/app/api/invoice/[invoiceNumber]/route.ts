import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  const { invoiceNumber } = await params;

  try {
    // Step 1:
    // Database invoice 

    // Step 2:
    // generateInvoice() call 

    // Step 3:
    // PDF return 

    return NextResponse.json({
      success: true,
      invoiceNumber,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate invoice",
      },
      { status: 500 }
    );
  }
}