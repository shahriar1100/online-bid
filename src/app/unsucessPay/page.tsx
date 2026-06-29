// src/app/unsucessPay/page.tsx
import { Suspense } from "react";
import Header from "src/components/header";
import Footer from "src/components/footer";
import UnsucessPayContent from "src/components/UnsucessPayContent";

export default function Unsucesspay() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading payment status...</div>}>
        <UnsucessPayContent />
      </Suspense>
      <Footer />
    </>
  );
}