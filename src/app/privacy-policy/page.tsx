"use client";

import Header from "src/components/header";
import Footer from "src/components/footer";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="container text-sm">
                    <h1 className="text-lg md:text-3xl font-bold mb-4">Privacy policy</h1>
                    <p className="text-gray-600 mb-8">
                        Updated:  January 30<sup>th</sup> 2026
                    </p>

                    <section className="mb-10">
                        <p className="mb-4">
                            We collect personal and technical information including name, email, phone number, transaction data, IP address,
                            cookies, and communications.
                        </p>
                        <ul className="list-inside">
                            <li className="mb-4">
                                Information is used to:
                                Operate services, process payments, prevent fraud, communicate with users, and comply with law.
                            </li>
                            <li className="mb-4">
                                Payments:
                                Handled by third-party processors. We do not store financial information.
                            </li>
                            <li className="mb-4">
                                Data Sharing:
                                Only with processors, service providers, or legal authorities.
                            </li>
                            <li className="mb-4">
                                Security:
                                Industry-standard safeguards are used.
                            </li>
                            <li className="mb-4">
                                User Rights:
                                You may request access, correction, or deletion of data.
                            </li>
                            <li className="mb-4">
                                Children:
                                Not for users under 18.
                            </li>
                            <li className="mb-4">
                                Contact: <br />
                                <Link
                                    href="mailto:support@ibids365.com">support@ibids365.com
                                </Link> | 
                                <Link
                                    href="tel:+13022098300"> (302) 209-8300
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
