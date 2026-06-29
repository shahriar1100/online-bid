"use client";

import Header from "src/components/header";
import Footer from "src/components/footer";

export default function AuctionRulesBiddingPolicy() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="container text-sm">
                    <h1 className="text-lg md:text-3xl font-bold mb-4">Auction Rules & Bidding Policy</h1>
                    <p className="text-gray-600 mb-8">
                        Updated:  January 30<sup>th</sup> 2026
                    </p>

                    <section className="mb-10">
                        <p className="mb-4">
                            All bids placed on IBIDS365 are legally binding offers.
                        </p>
                        <ul className="list-disc list-inside">
                            <p className="mb-2">By bidding you agree:</p>
                            <li className="mb-4">
                                You have legal authority to purchase
                            </li>
                            <li className="mb-4">
                                Funds are available
                            </li>
                            <li className="mb-4">
                                You intend to complete the transaction
                            </li>
                        </ul>
                        <ul className="list-disc list-inside">
                            <p className="mb-2">Sellers must:</p>
                            <li className="mb-4">
                                Own the asset or have authority to sell
                            </li>
                            <li className="mb-4">
                                Provide accurate descriptions
                            </li>
                            <li className="mb-4">
                                Comply with all laws
                            </li>
                        </ul>
                        <ul className="list-disc list-inside">
                            <p className="mb-2">IBIDS365 does not guarantee:</p>
                            <li className="mb-4">
                                Asset condition
                            </li>
                            <li className="mb-4">
                                Title status
                            </li>
                            <li className="mb-4">
                                Buyer or seller performance
                            </li>
                        </ul>
                        <ul className="list-disc list-inside">
                            <p className="mb-2">IBIDS365 may:</p>
                            <li className="mb-4">
                                Cancel auctions
                            </li>
                            <li className="mb-4">
                                Remove listings
                            </li>
                            <li className="mb-4">
                                Suspend accounts
                            </li>
                            <li className="mb-4">
                                Refuse service
                            </li>
                        </ul>
                        Shill bidding, fake bids, or manipulation is strictly prohibited.
                    </section>
                </div>
            </div>
            <Footer />
        </>
    );
}
