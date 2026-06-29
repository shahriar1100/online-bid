"use client";

import Header from "src/components/header";
import Footer from "src/components/footer";
import Link from "next/link";

export default function FAQ() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="container text-sm">
                    <h1 className="text-lg md:text-3xl font-bold mb-4">Frequently Asked Questions (FAQ)</h1>
                    <p className="text-gray-600 mb-8">
                        Updated:  January 30<sup>th</sup> 2026
                    </p>

                    <section className="mb-10">

                        <ul className="list-inside">
                            <li className="mb-4">
                                Q: What is IBIDS365? <br />
                                A: An online auction marketplace for real estate, automobiles, and business assets.
                            </li>
                            <li className="mb-4">
                                Q: What fees do you charge? <br />
                                A: 1% or $495 (whichever is higher) to both buyer and seller.
                            </li>
                            <li className="mb-4">
                                Q: Are bids binding?<br />
                                A: Yes.
                            </li>
                            <li className="mb-4">
                                Q: Are refunds available? <br />
                                A: Generally no.
                            </li>
                            <li className="mb-4">
                                Q: Is IBIDS365 a broker or dealer? <br />
                                A: No.
                            </li>
                            <li className="mb-4">
                                Q: How do I contact support? <br />
                                A: <Link
                                    href="tel:+13022098300"> (302) 209-8300
                                </Link> or <Link
                                    href="mailto:support@ibids365.com">support@ibids365.com
                                </Link>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
            <Footer />
        </>
    );
}
