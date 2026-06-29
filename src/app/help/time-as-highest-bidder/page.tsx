"use client"

// import Image from "next/image"
import Footer from "src/components/footer"
import Header from "src/components/header"
import HelpSidebar from "src/components/helpcenter"
// import bidder from "src/app/assets/images/help/highestbidder/tahb-desktop.png"

export default function HighestBidder() {
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
                            What is &quot;Time as highest bidder&quot;?
                        </h1>

                        <h2 className="help-headings">
                            We reward you for bidding on our Bid Fee platform
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                Each time you are the highest bidder, your bidder bar fills up. When the bar is full, you can claim your free bids and your level goes up. The higher your level, the more free bids you earn.
                            </p>

                        </div>

                        <h2 className="help-headings">
                            Highest bidder bar explained
                        </h2>
                        <div className="mt-5 mb-5">
                            <div className="flex items-center gap-4 flex-wrap">
                                <Image
                                    src={bidder}
                                    alt="Payment methods"
                                    width={100}
                                    height={100}
                                    className="object-contain w-250"
                                />
                            </div>
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
