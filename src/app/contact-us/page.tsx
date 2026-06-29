"use client"

import { MailCheck } from "lucide-react"
import Link from "next/link"
import ContactForm from "src/components/contact-form"
import Footer from "src/components/footer"
import Header from "src/components/header"

export default function ContactSupport() {
  return (
    <>
      <Header />
      <div className="container">
        <div className="flex flex-col items-center justify-center pt-24">
          <h2 className="section-title pb-4">
            CONTACT SUPPORT
          </h2>

          <div className="w-full max-w-md">
            {/* Email */}
            <div className="rounded border border-slate-300 bg-slate-50 p-6 text-center shadow dark:bg-gray-800">
              <div className="flex justify-center w-full">
                <MailCheck className="text-blue-600 w-auto h-10" />
              </div>

              <div className="space-y-1 mt-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-500">
                  Drop us a line
                </h3>
                <Link
                  href="mailto:support@ibids365.com"
                  className="text-blue-600 hover:underline"
                >
                  support@ibids365.com
                </Link>
              </div>

            </div>

            <div className="relative flex items-center my-8">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
