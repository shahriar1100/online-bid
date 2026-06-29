"use client"

// import Image from "next/image"
import Footer from "src/components/footer"
import Header from "src/components/header"
import HelpSidebar from "src/components/helpcenter"

export default function Bidpack() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-20">
                <div className="flex justify-start items-start container gap-10">
                    {/* Left */}
                    <HelpSidebar />

                    {/* Right */}
                    {/* <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
                            WHAT IS A BID PACK?
                        </h1>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p className="font-semibold">
                                Bids come in packs of bids called Bid Packs.
                            </p>
                            <p>
                                Before you can participate in auctions, you have to add bids to your account.
                            </p>
                            <p>
                                A bid pack is what you need to buy to get started with bidding. DealDash operates in a pay to play model so before you can take part in an auction you need to buy bids. As soon as you have bids in your account you can start bidding.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Buy Your Bids
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                The bid price may change daily depending on the active offers. Make sure to check out the current offer often, not to miss out on the cheapest days. You can pay for your bid packs with any major Credit or Debit Card or PayPal. We also accept Visa Electron and Maestro Debit cards.
                            </p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <Image
                                    src={payment}
                                    alt="Payment methods"
                                    width={350}
                                    height={80}
                                    className="object-contain"
                                />
                            </div>

                            <div>
                                <button className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition">
                                    GET YOUR BIDS NOW
                                </button>
                            </div>
                        </div>

                        <h2 className="help-headings">
                            Get Busy Bidding
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 ">
                                You&#39;re ready to go! Each time you place a bid, one bid is removed from your Bid Balance, so keep an eye on it. If it&#39;s starting to get low, just buy another Bid Pack, try bidding on one in the Bid Pack Auctions, or use the &quot;Buy it Now&quot; option to get your bids back from an auction.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                Each bid increases the auction price by 1 cent. The auction continues until nobody places a bid within a 10 second time period. When you win an auction, simply pay the winning price and the item will be delivered within 14 days!
                            </p>
                        </div>
                        <button
                            className="btn-nontransparent"
                        >
                            Start Bidding
                        </button>
                    </div> */}
                </div>
            </div>
            <Footer />
        </>
    )
}
