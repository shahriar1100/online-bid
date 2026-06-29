"use client";

import Header from "src/components/header";
import Footer from "src/components/footer";

export default function Termsofservice() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="container text-sm">
                    <h1 className="text-lg md:text-3xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-gray-600 mb-8">
                        Last Updated: January 30<sup>th</sup> 2026
                    </p>
                    <section className="mb-10">
                        <p className="mb-4">
                            By accessing or using the website and services of IBIDS365, Inc. (“Company,” “we,” “our,” or “us”), you agree to be
                            legally bound by these Terms of Service.
                        </p>
                        <ul className="list-decimal list-inside">
                            <li className="mb-4">
                                Eligibility
                                You must be at least 18 years old and capable of forming a legally binding agreement.
                            </li>
                            <li className="mb-4">
                                Platform Description
                                IBIDS365 operates an online auction and marketplace platform for real estate, automobiles, business assets, and
                                approved property. We are not a real estate broker, vehicle dealer, escrow agent, lender, financial institution, or
                                fiduciary.
                            </li>
                            <li className="mb-4">
                                No Agency Relationship
                                Nothing in these Terms creates any partnership, joint venture, agency, or employment relationship.
                            </li>
                            <li className="mb-4">
                                User Accounts
                                You are responsible for maintaining the confidentiality of your account credentials and all activities conducted under
                                your account.
                            </li>
                            <li className="mb-4">
                                Listings & Auctions
                                Users are solely responsible for the accuracy, legality, ownership, condition, zoning, liens, and regulatory compliance
                                of their listings.
                            </li>
                            <li className="mb-4">
                                Fees & Payments
                                IBIDS365 charges a marketing and platform fee to both buyers and sellers.
                                The fee is 1% of the final transaction price or $495 USD, whichever is higher, per transaction.
                            </li>
                            <p className="mb-4">Payments are processed through third-party payment processors.
                                We do not store payment information.
                                All fees are disclosed before bidding or purchase.
                                All payments are non-refundable unless stated otherwise in writing.</p>
                            <li className="mb-4">
                                Chargebacks & Fraud
                                Chargebacks or fraudulent activity may result in immediate termination and legal action.
                            </li>
                            <li className="mb-4">
                                Prohibited Conduct
                                Illegal activity, false information, auction manipulation, fee avoidance, fraudulent bidding, or security interference is
                                prohibited.
                            </li>
                            <li className="mb-4">
                                Compliance with Laws
                                Users must comply with all applicable federal, state, and local laws.
                            </li>
                            <li className="mb-4">
                                Disclaimer of Warranties
                                Services are provided “as is” and “as available.”
                            </li>
                            <li className="mb-4">
                                Limitation of Liability
                                IBIDS365 shall not be liable for indirect, incidental, special, consequential, or punitive damages.
                            </li>
                            <li className="mb-4">
                                Indemnification
                                You agree to indemnify IBIDS365 from any claims arising from platform use.
                            </li>
                            <li className="mb-4">
                                Intellectual Property
                                All content and software are owned by IBIDS365, Inc.
                            </li>
                            <li className="mb-4">
                                Suspension & Termination
                                Accounts may be suspended or terminated at our discretion.
                            </li>
                            <li className="mb-4">
                                Arbitration
                                Disputes shall be resolved through binding arbitration where permitted.
                            </li>
                            <li className="mb-4">
                                Governing Law
                                Delaware law governs these terms.
                            </li>
                            <li className="mb-4">
                                Contact <br />
                                IBIDS365, Inc.
                                8 The Green #25307, Dover, DE 19901
                                (302) 209-8300
                            </li>
                        </ul>
                    </section>
                </div>
            </div >
            <Footer />
        </>
    );
}
