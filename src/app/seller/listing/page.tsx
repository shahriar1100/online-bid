// src/app/unsucessPay/page.tsx
import { Suspense } from "react";
import Header from "src/components/header";
import Footer from "src/components/footer";
import Listing from "src/components/seller/ListingContent";

export default function Unsucesspay() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading payment status...</div>}>
        <Listing />
      </Suspense>
      <Footer />
    </>
  );
}