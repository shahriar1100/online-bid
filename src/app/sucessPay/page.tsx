// src/app/sucessPay/page.tsx
import { Suspense } from "react";
import Header from "src/components/header";
import Footer from "src/components/footer";
import Sucesspay from "src/components/SucessPayContent";

export default function Unsucesspay() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading payment status...</div>}>
        <Sucesspay />
      </Suspense>
      <Footer />
    </>
  );
}