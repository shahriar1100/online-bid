"use client"

// import Image from "next/image"
import Footer from "src/components/footer"
import Header from "src/components/header"
import HelpSidebar from "src/components/helpcenter"


export default function Tips() {
    return (
        <>
            <Header />
            <div className="mt-28 mb-16">
                <div className="flex justify-start items-start container gap-10">
                    {/* Left */}
                    <HelpSidebar />

                    {/* Right */}
                    {/* <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
                            TIPS & TRICKS
                        </h1>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <Image
                                    src={tat}
                                    alt="Conserve bids"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Conserve Your Bids
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Bidding rapidly will only waste your bids and inflate the auction
                                        price. Bid strategically, or book BidBuddy to do it for you.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={timer}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Book A BidBuddy
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        The majority of auctions on DealDash are won by using the
                                        BidBuddy. The BidBuddy strategically places bids for you. It waits
                                        until the last second to bid. You can put a limit on how many bids
                                        will be used. And you can cancel it at any time.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="ml-16">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        1. Go to an auction&apos;s detail page:
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Click on any active auction to view its detail page.
                                    </p>
                                    <div className="mt-4">
                                        <Image
                                            src={deals}
                                            alt="Auction example"
                                            width={100}
                                            height={100}
                                            className="rounded-lg shadow-md w-230"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="ml-16">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        2. Book a BidBuddy:
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Type in the number of bids you want to use, then click &quot;Book a BidBuddy&quot;
                                    </p>
                                    <div className="mt-4">
                                        <Image
                                            src={book}
                                            alt="Auction example"
                                            width={100}
                                            height={100}
                                            className="rounded-lg shadow-md w-230"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={earn}
                                    alt="Conserve bids"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Earn Free Bids
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        When you are the Highest Bidder, you will earn time towards your next level. When you reach a new level, you receive free bids.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={study}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Study The Competition
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Who else is bidding on the item? Watch and learn. Some people keep a notepad to track bidders and what type of bidding strategies they are using.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={bag}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Buy It Now & Get Your Bids Back
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        If you do not win an auction, you can get your bids back, by taking advantage of the Buy It Now option. If you bid 100 times on a $50 Walmart Gift Card and don&#39;t win, you can just buy the item for $50 and get all your bids back for free. You can now re-use your bids to try to win another auction!
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Where is the Buy It Now option?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        It is located in two places for your convenience:
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="ml-16">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        1. At the bottom of every auction
                                    </h3>
                                    <div className="mt-4">
                                        <Image
                                            src={buy}
                                            alt="Auction example"
                                            width={100}
                                            height={100}
                                            className="rounded-lg shadow-md w-230"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="ml-16">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        2. At the bottom of every auction detail page
                                    </h3>
                                    <div className="mt-4">
                                        <Image
                                            src={auction}
                                            alt="Auction example"
                                            width={100}
                                            height={100}
                                            className="rounded-lg shadow-md w-230"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={win}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Exchange a Win to Bids
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Won an auction with just a few bids? With our Bid Exchange Offer, you can increase your bid balance by exchanging the item to bids for use in your next auction!
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={trophy}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Check Out The Winners
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        The winners page reveals recently won items and the final auction prices.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={moon}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Try Different Times
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Auctions might be easier to win at different times of the day. Auctions are only open to the US and Canada.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={calcualator}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        On a Budget?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Try bidding on less-expensive, less-popular items. There will likely be less competition.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <Image
                                    src={tag}
                                    alt="Book a BidBuddy"
                                    width={50}
                                    height={50}
                                    className="shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        Buy Bids on Sale
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Make sure to visit DealDash regularly so you can keep up to date on promotions and save on bids!
                                    </p>
                                </div>
                            </div>
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
