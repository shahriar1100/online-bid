"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const helpLinks = [
    { href: "/help/auction", label: "How to bid in an Auction" },
    { href: "/help/tips-and-tricks", label: "Tips & Tricks" },
    { href: "/help/faq", label: "Frequently Asked Questions" },
    { href: "/help/bid-pack", label: "What is a Bid Pack?" },
    { href: "/help/time-as-highest-bidder", label: "What is 'Time as Highest Bidder'?" },
]

export default function HelpSidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64">
            <h4 className="font-semibold text-slate-900 mb-5 text-lg border-b border-black dark:border-white pb-2 inline-block dark:text-white">
                Help Center
            </h4>
            <ul className="space-y-2">
                {helpLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={`block px-3 py-2 rounded transition-colors text-[#4b5563] ${isActive
                                        ? "bg-gray-800 text-white font-medium"
                                        : "hover:bg-gray-200 dark:hover:bg-gray-800 dark:text-white"
                                    }`}
                            >
                                {link.label}    
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
