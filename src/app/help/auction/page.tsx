"use client"

// import Link from "next/link"
// import Image from "next/image"
import Footer from "src/components/footer"
import Header from "src/components/header"
import HelpSidebar from "src/components/helpcenter"


export default function HowToBidPage() {
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
                            HOW TO BID IN AN AUCTION
                        </h1>

                        <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200 border-b border-[#333b48] dark:border-white inline-block pb-1">
                            Here&#39;s what makes DealDash auctions different:
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                <strong>STARTING PRICE:</strong> All auctions start at $0.00 - and have no minimum reserve
                                prices!
                            </p>
                            <p>
                                <strong>1¢ INCREASES:</strong> Each bid placed adds 1 penny to the auction price.
                            </p>
                            <p>
                                <strong>9-SECOND TIMER:</strong> The 9-Second countdown timer restarts when a new bid is
                                placed.
                            </p>
                            <p>
                                <strong>WINNING:</strong> If no new bids come in during the next 9 seconds, you win!
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Bids
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                Before you can take part in an auction you need to buy bids. Bids are currently on sale
                                for 14¢ each and can be purchased with any major credit card or PayPal.
                            </p>
                            <p>
                                Bids are purchased in batches called Bid Packs. These Bid Packs come in various sizes,
                                and add the bids to your account&apos;s Bid Balance.
                            </p>
                            <p>
                                Your Bid Balance shows how many bids you have remaining in your account. When you are running low on bids, simply purchase a new Bid Pack, or bid on one in our many Bid Pack auctions!
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Winning
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                Winning isn&apos;t everything. But it&apos;s probably why you bid.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                After you&apos;ve won an auction, you have a few different options.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <Image src={purchase} alt="Purchase your product" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            PURCHASE YOUR PRODUCT
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            Once you&apos;ve won the auction, purchase the product you&apos;ve won for the final auction price.
                                            You have 14-days to complete the transaction.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Image src={exchange} alt="Exchange for bids" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            EXCHANGE FOR BIDS
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            You can also choose to exchange your product for more bids to put towards future auctions.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Image src={buyNow} alt="Buy it now" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            BUY IT NOW
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            Sometimes you won&apos;t win the auctions you&apos;ve entered. But you can always buy the product at
                                            the Buy It Now price and get all the bids from that auction back to your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="help-headings">
                            Auction
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                We told you our auctions were special.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                We&#39;ve built in some special features to help you win.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <Image src={buddy} alt="Purchase your product" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            BID BUDDY
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            BidBuddy strategically places bids for you. It waits until the last second to bid. You can put a limit on how many bids will be used. And you can cancel it at any time.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Image src={level} alt="Exchange for bids" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            BIDDER LEVELS
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            Every time you bid on DealDash, you earn points towards your next bidder level. Every level you unlock comes with special rewards, like free bids and more.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Image src={time} alt="Buy it now" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            TIME AS HIGHEST BIDDER
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            Your time as highest bidder bar fills up as you become the the highest bidder in auctions. When the bar is full you unlock the next level, and the rewards that come with it.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="help-headings">
                            Promotions & Rewards
                        </h2>
                        <div className="mt-5">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                But that&#39;s not all, folks...
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                We constantly offer exciting daily promotions and offers to say thank you for using DealDash.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <Image src={discount} alt="Purchase your product" width={100} height={100} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            DISCOUNTED BIDS
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            The price of bids can change daily depending on the active offers. You can always see what&#39;s on offer from the banner on the front page or the bids store.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Image src={special} alt="Exchange for bids" width={50} height={50} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                            SPECIALTY AUCTIONS
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            All of our auctions are special. These ones are just EXTRA special. Visit the promotions page to see the different kinds of specialty auctions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="help-headings">
                            Free Shipping
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                No gimmicks. Nothing up our sleeve.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                Whatever you win is shipped to you for free. Anywhere in the continental US and Canada (except Quebec).
                            </p>

                            <div className="flex items-start gap-4">
                                <Image src={shipping} alt="Free Shipping" width={70} height={70} />
                                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                                    <p>
                                        <strong>YOU DON&apos;T PAY FOR SHIPPING:</strong> Shipping is always free with DealDash.
                                    </p>
                                    <p>
                                        <strong>YOU DON&apos;T PAY FOR HANDLING:</strong> Seriously. Shipping is always free with DealDash.
                                    </p>
                                    <p>
                                        <strong>YOU DON&apos;T PAY FOR PACKAGING:</strong> We promise. Shipping is always free with DealDash. ALWAYS.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h2 className="help-headings">
                            Products
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                                We&#39;ve got the goods. And they&#39;re pretty great.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                Brands that you know and products you&#39;ll love.
                            </p>

                            <div className="flex items-start gap-4">
                                <Image src={products} alt="Free Shipping" width={70} height={70} />
                                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                                    <p>
                                        <strong>NAME BRANDS: </strong> We have a lot of the same products and brands you can buy in your local big box stores. And car dealerships.
                                    </p>
                                    <p>
                                        <strong>DESIGNER PRODUCTS:</strong> Unique pieces from global designers that are equal parts fashion and function.
                                    </p>
                                    <p>
                                        <strong>GLOBAL ARTISANS:</strong> We work with underexposed talents from around the world and bring their work into the limelight.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <p className="mb-6 text-slate-700 dark:text-slate-300">
                                <strong>Still have questions?</strong>{" "}
                                <Link href="/contact" className="text-blue-600 hover:underline">
                                    Contact Customer Support
                                </Link>{" "}
                                - We do everything in our power to make sure you have the best experience
                                possible with our service.
                            </p>

                            <button
                                className="btn-nontransparent"
                            >
                                Start Bidding
                            </button>
                        </div>
                    </div> */}
                </div>
            </div>
            <Footer />
        </>
    )
}
