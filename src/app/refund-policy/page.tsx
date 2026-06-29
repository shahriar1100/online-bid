"use client";

import Header from "src/components/header";
import Footer from "src/components/footer";

export default function RefundPolicy() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="container text-sm">
                    <h1 className="text-lg md:text-3xl font-bold mb-4">Refund policy</h1>
                    <p className="text-gray-600 mb-8">
                        Updated:  January 30<sup>th</sup> 2026
                    </p>

                    <section className="mb-10">
                        <p className="mb-4">
                            All fees charged by IBIDS365, Inc., including marketing and platform fees, are non-refundable.
                            Refunds will only be considered if:
                        </p>
                        <ul className="list-disc list-inside">
                            <li className="mb-4">
                                Required by law
                            </li>
                            <li className="mb-4">
                                Duplicate payment occurred
                            </li>
                            <li className="mb-4">
                                Technical error directly caused by IBIDS365
                            </li>
                        </ul>
                        <ul>
                            <li className="mb-4">
                                Disputes must be submitted within 7 days of transaction.
                            </li>
                            <li className="mb-4">
                                Chargebacks filed without first contacting IBIDS365 may result in account termination.
                            </li>
                            <li className="mb-4">
                                Refund approvals are at the sole discretion of IBIDS365.
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
            <Footer />
        </>
    );
}
