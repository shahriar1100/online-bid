"use client";

import React from "react";
import { Star } from "lucide-react";
import Image from "next/image";
import ratingdp from "src/app/assets/images/buyer/rating.jpg";

export default function WinnersAndReviewsPage() {
  const winners = [
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
    { user: "tata", cost: "$63.32", bids: "271 Bid Placed", final: "$9.30", date: "29/7/2025" },
  ];

  const reviews = [
    {
      rating: 4.4,
      text: "Overall, I’d highly recommend buying a car online—especially for busy individuals who prefer a hassle-free, no-pressure experience. It’s modern, efficient, and surprisingly personal.",
      user: "Joycedkill",
      date: "12/09/2025",
      avatar: ratingdp,
    },
    {
      rating: 4.4,
      text: "Overall, I’d highly recommend buying a car online—especially for busy individuals who prefer a hassle-free, no-pressure experience. It’s modern, efficient, and surprisingly personal.",
      user: "Joycedkill",
      date: "12/09/2025",
      avatar: ratingdp,
    },
    {
      rating: 4.4,
      text: "Overall, I’d highly recommend buying a car online—especially for busy individuals who prefer a hassle-free, no-pressure experience. It’s modern, efficient, and surprisingly personal.",
      user: "Joycedkill",
      date: "12/09/2025",
      avatar: ratingdp,
    },
  ];

  return (
    <>
      {/* Winners Section */}
      <div className="bg-[#D1E0EA] rounded mx-auto overflow-hidden mt-6">
        <h2 className="text-center text-base font-medium py-4">
          Winners in the last 30 days
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#E9F2F9] text-[#333b48] font-semibold ">
              <th className="table-header">User</th>
              <th className="table-header">Est. Total Cost</th>
              <th className="table-header">Final Bid</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((winner, index) => (
              <tr
                key={index}
                className="odd:bg-white even:bg-[#F7F9FA] text-[#333B48]"
              >
                <td className="table-header">{winner.user}</td>
                <td className=" table-header">
                  <div>{winner.cost}</div>
                  <div className="text-xs text-gray-500">{winner.bids}</div>
                </td>
                <td className="table-header">
                  <div className="font-semibold">{winner.final}</div>
                  <div className="text-xs text-gray-500">{winner.date}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="mx-auto bg-white rounded my-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Ratings & Reviews</h2>
          <button className="btn-nontransparent">
            Add review
          </button>
        </div>

        <div className="flex items-center gap-4 pb-6 mb-3 text-[#333B48]">
          <div className="flex justify-center items-center flex-wrap gap-0.5 flex-col">
            <span className="text-3xl font-semibold">4.3</span>
            <span className="text-sm">Out of 5</span>
          </div>
          <div className="text-sm border-r border-[#333b48/90] pr-4">
            <span className="font-medium">1,5K Ratings & <br/> 126 Reviews</span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span>Product Quality</span>
              <span className="flex text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-gray-300" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>As Described</span>
              <span className="flex text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-gray-300" />
                <Star className="w-4 h-4 text-gray-300" />
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-[#333b48]">
          {reviews.map((review, index) => (
            <div key={index} className="border-b last:border-none border-gray-200 pb-4">
              <div className="inline-flex items-center bg-[#008526] text-white text-sm font-normal px-2 py-0.5 rounded mb-2">
                {review.rating} ★
              </div>
              <p className="text-sm mb-4">{review.text}</p>
              <div className="flex items-center gap-1 text-xs text-[#333b48]">
                <Image
                  src={review.avatar}
                  alt={review.user}
                  width={100}
                  height={100}
                  className="rounded-full w-auto h-7"
                />
                <span className="">{review.user},</span>
                <span className="">{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <a href="#" className="text-blue-600 hover:underline text-sm">
            View more
          </a>
        </div>
      </div>
    </>
  );
}
