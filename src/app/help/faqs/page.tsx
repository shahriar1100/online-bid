"use client"

// import Link from "next/link"
import Footer from "src/components/footer"
import Header from "src/components/header"
import HelpSidebar from "src/components/helpcenter"

export default function Faqs() {
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
                            FREQUENTLY ASKED QUESTIONS
                        </h1>

                        <h2 className="help-headings">
                            Is DealDash Safe?
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                100%. Customer safety and satisfaction is our Number One priority. We&#39;ve created safeguards to minimize risk and ensure you can bid without compromises.
                            </p>
                            <p>
                                <strong>90-Day Money Back Guarantee:</strong> We offer a 100% money back guarantee on your first Bid Pack within 90 days of purchase. No questions asked.
                            </p>
                            <p>
                                <strong>Secure Payments:</strong> All of our Credit Card, Debit Card, and PayPal payments are safe. We use SSL encryption to make sure that the transactions are 100% secure.
                            </p>
                            <p>
                                <strong>Worry-Free:</strong> As our customers know, we take your trust seriously. But don&#39;t take our word for it - check out our A+ rating on the BBB website and the thousands of reviews on TrustPilot and Sitejabber.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Is DealDash Legit?
                        </h2>

                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                Absolutely! We consistently help customers save 90% or more on products they love.
                            </p>
                            <p>
                                DealDash helps companies liquidate their assets and move their surplus stock by buying their items and offering them to our Customers at a fraction of the retail price.
                            </p>
                            <p>
                                A nominal bidding fee enables us to keep the prices low and the savings huge.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            How Does DealDash Make Such Great Deals Possible?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 ">
                                <strong>Our secret:</strong> Great Partnerships. We form strong relationships with suppliers, producers, and our customers. We then harness that power to keep the winning auction prices as low as possible, and pass that value on to our customers.                        </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                <strong>Overstocked Warehouses:</strong> We have a network of suppliers across the country who have granted us exclusive access to their overstocked warehouses filled with products and brands you know and love.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                <strong>Untapped Resources:</strong> We search for underexposed designers and producers from around the world and shine a light on their talents, giving them well-deserved exposure and bringing their products to the US market.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                <strong>Loyal Customers:</strong> As a pay-to-bid auction, our customers agree to pay a small service fee for each bid. These fees not only help us provide a great service, but they help deter overbidding, which keeps the final auction prices low.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            What Happens When I Win?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                You celebrate! Next, you buy the product by paying the Won Auction Price, including any applicable sales tax, and we ship the item to you absolutely FREE of charge!
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                You may also choose to trade the item in for extra bids, which can be used towards future auctions.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Where Do The Products Come From?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                Everywhere. We work directly in partnership with major retailers, brands and distributors to source a variety of items and keep our product selection fresh and exciting for shoppers.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                We auction off many of the same products available in your local big box stores, as well as unique pieces from international designers that are equal parts fashion and function.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Are the Products New?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                Yes. All of the products we sell are brand-spanking new and in the original packaging.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 mb-7">
                                Except for cars, which are new, but don&#39;t come with any packaging.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Is there a subscription fee?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                No, there is no subscription fee and you only pay for the bids you buy.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Where do you ship?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                We ship to the Contiguous US and most provinces and territories in Canada.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Do you ship to Canada?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                Yes! We ship to the following provinces and territories in Canada: Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland & Labrador, Northwest Territories, Nova Scotia, Nunavut Territory, Ontario, Prince Edward Island, Saskatchewan, Yukon Territory.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Where Can I See My Account Details?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200">
                                You can find your Account Details, manage payment information, and update your Bidder Bio all from your Dashboard.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            Do You Have Any Hints or Tips To Help Me Win More Auctions?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-20">
                                To start, watch our How it Works Video for a quick overview of what to expect.
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                                We also have an Online Tutorial with step-by-step instructions.
                            </p>
                            <p className="text-slate-800 dark:text-slate-200">
                                When it comes to bidding strategy, here are some top customer-voted tips:
                            </p>
                            <div className="mt-6">
                                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                                    <li>Bid only on items you like</li>
                                    <li>Focus on one auction at a time</li>
                                    <li>Decide in advance how many bids you&#39;re willing to use in the auction</li>
                                    <li>
                                        Use Buy it Now if you don’t win to get your bids back and the item
                                    </li>
                                    <li>Set a budget and stick to it</li>
                                </ul>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 mt-3 mb-3">
                                Finally, you can always check out the Auction Tips for even more insights.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            How Can I Get Free Bids?
                        </h2>
                        <div className="mt-5 ">
                            <p> We offer free bids to reward our customers and thank them for using DealDash. You can earn some bids easily with some of the following options:
                            </p>
                            <p>
                                <strong>Bidder Levels:</strong> Level up your Bidder Level with Time As Highest Bidder to get a bid bonus.
                            </p>
                            <p>
                                <strong>Bid Daily:</strong> As part of our Bidder Reward program, bid every day to get a daily bid reward.
                            </p>
                            <p>
                                <strong>Featured Promotions:</strong> Participate in our featured promotions, such as auction leaderboards for an extra bonus.
                            </p>
                            <p>
                                <strong>Bid Pack Auctions:</strong> Win a Bid Pack auction for bargain-priced bids.
                            </p>
                            <p>
                                <strong>Be Social:</strong> We run special social campaigns on our Facebook page and YouTube channel where you can share your story and earn even more free bids.
                            </p>
                        </div>

                        <h2 className="help-headings">
                            When Will My Order Ship?
                        </h2>
                        <div className="mt-5 ">
                            <p className="text-slate-800 dark:text-slate-200 ">
                                As soon as possible. We ship products at the earliest possible opportunity, and are usually shipped within 2-5 business days after receiving your order. This may vary depending upon the supplier for the item.
                            </p>
                            <p className="text-slate-800 dark:text-slate-200 ">
                                Once orders have been shipped, total delivery time can take 5-10 business days. Depending upon the information we receive from the supplier, tracking information should be available from My Orders in the Dashboard.
                            </p>
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
