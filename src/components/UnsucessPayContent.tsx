// "use client";

// import Image from "next/image";
// import { AlertTriangle, RefreshCcw } from "lucide-react";
// import Footer from "src/components/footer";
// import Header from "src/components/header"
// import cross from "src/app/assets/images/seller/unsucess.png"
// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function Unsucesspay() {

//   //try again loading
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const selectedAds = searchParams.get('selectedAds');
// const returnPath = searchParams.get('returnPath');
//  const userType = searchParams.get('userType');
//   const handleRetry = () => {
//     setLoading(true);
//      setTimeout(() => {
//       const adsParam = selectedAds ? `selectedAds=${selectedAds}` : '';
//       const pathParam = returnPath ? `&returnPath=${returnPath}` : '';
//       const userParam = userType ? `&userType=${userType}` : '';
//       router.push(`/sucessPay?${adsParam}${pathParam}${userParam}`);
//     }, 1500);
//   };

//   return (
//     <>
//       <Header />
//       <section className="payment-page">
//         <Image
//           src={cross}
//           alt="Payment Failed"
//           width={100}
//           height={100}
//           className="payment-image"
//         />

//         <div className="payment-title">
//           <AlertTriangle className="text-yellow-500 w-6 h-6" />
//           <span>Payment Failed</span>
//         </div>

//         <p className="payment-description">
//           We couldn&apos;t process your payment. Your post has not been featured. <br />
//           Please check your payment details and try again.
//         </p>

//         <button
//           onClick={handleRetry}
//           disabled={loading}
//           className="payment-button"
//         >
//           Try again
//           <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//         </button>
//       </section>

//       <Footer />
//     </>
//   );
// }


"use client";

import Image from "next/image";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";
import Footer from "src/components/footer";
import Header from "src/components/header";
import cross from "src/app/assets/images/seller/unsucess.png";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Unsucesspay() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedAds = searchParams.get("selectedAds");
  const listingTypes = searchParams.get("listingTypes");
  const returnPath = searchParams.get("returnPath") || "/seller/listing";
  // const userType = searchParams.get("userType");
  const paymentType = searchParams.get("type"); // 'featured' or 'auction'

  const handleRetry = async () => {
    setLoading(true);

    if (paymentType === "featured" && selectedAds && listingTypes) {
      // Re-initiate the payment process
      try {
        const authToken = localStorage.getItem("authToken");
        const userStr = localStorage.getItem("user");

        if (!authToken || !userStr) {
          router.push("/");
          return;
        }

        const user = JSON.parse(userStr);
        const adIds = selectedAds.split(",").map(Number).filter((id) => !isNaN(id));
        const types = listingTypes.split(",");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/payment/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              userId: Number(user.id),
              selectedAds: adIds,
              listingTypes: types,
            }),
          }
        );

        const data = (await response.json()) as {
          success: boolean;
          url?: string;
          error?: string;
        };

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          console.error("Failed to create checkout session:", data.error);
          setLoading(false);
        }
      } catch (error) {
        console.error("Retry payment error:", error);
        setLoading(false);
      }
    } else {
      // Fallback: go back to listing page
      router.push(returnPath);
    }
  };

  const handleGoBack = () => {
    router.push(returnPath);
  };

  return (
    <>
      <Header />
      <section className="payment-page">
        <Image
          src={cross}
          alt="Payment Failed"
          width={100}
          height={100}
          className="payment-image"
        />

        <div className="payment-title">
          <AlertTriangle className="text-yellow-500 w-6 h-6" />
          <span>Payment Failed</span>
        </div>

        <p className="payment-description">
          We couldn&apos;t process your payment. Your post has not been
          featured. <br />
          Please check your payment details and try again.
        </p>

        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="payment-button"
          >
            {loading ? "Processing..." : "Try Again"}
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleGoBack}
            disabled={loading}
            className="payment-button-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </section>

      <Footer />
    </>
  );
}