// "use client";

// import Image from "next/image";
// import { ArrowRight, PartyPopper } from "lucide-react";
// import Footer from "src/components/footer";
// import Header from "src/components/header"
// import cross from "src/app/assets/images/seller/sucess.png"
// import { useRouter, useSearchParams } from "next/navigation";

// export default function Sucesspay() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const selectedAds = searchParams.get('selectedAds');
//     const returnPath = searchParams.get('returnPath');
    
//     const handleGoToDashboard = () => {
//         if (returnPath) {
//             // Safely handle the selectedAds string
//             const selectedAdIds = selectedAds ? selectedAds.split(',').filter(id => !isNaN(Number(id))).map(Number) : [];

//             const featuredQuery = selectedAdIds.length > 0 ? `?featured=${selectedAdIds.join(',')}` : '';
//             router.push(`${returnPath}${featuredQuery}`);
//         } else {
//             router.push('/');
//         }
//     };

//     return (
//         <>
//             <Header />
//             <section className="payment-page">
//                 <Image
//                     src={cross}
//                     alt="Payment Success"
//                     width={100}
//                     height={100}
//                     className="payment-image w-16"
//                 />

//                 <div className="payment-title">
//                     <PartyPopper className="text-yellow-500 w-6 h-6" />
//                     <span>Payment Successful!</span>
//                 </div>

//                 <p className="payment-description">
//                     Thank you for your purchase. Your post has been featured and will now <br />
//                     receive extra visibility.
//                 </p>

//                 <button
//                     onClick={handleGoToDashboard}
//                     className="payment-button"
//                 >
//                     Go to Dashboard
//                     <ArrowRight className="w-4 h-4" />
//                 </button>
//             </section>

//             <Footer />
//         </>
//     );
// }


// app/successPay/page.tsx (or sucessPay if keeping typo)
"use client";

import Image from "next/image";
import { ArrowRight, PartyPopper } from "lucide-react";
import Footer from "src/components/footer";
import Header from "src/components/header";
import successImage from "src/app/assets/images/seller/sucess.png";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
interface VerifyPaymentResponse {
  success: boolean;
  error?: string;
}

// Map listingType to actual route path
function getRoutePath(listingType: string): string {
  const routeMap: Record<string, string> = {
    realestate: "realestate",  // worker uses "realestate", route uses "real-state"
    automobile: "automobile",
    business: "business",
  };
  return routeMap[listingType] || listingType;
}

export default function SucessPay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Common params
  const paymentType = searchParams.get('type');
  
  // Featured post params
  const selectedAds = searchParams.get('selectedAds');
  const returnPath = searchParams.get('returnPath');
  
  // Auction params
  const listingId = searchParams.get('listingId');
  const listingType = searchParams.get('listingType');
  useEffect(() => {
  if (paymentType !== "auction") return;

  const sessionId = searchParams.get("session_id");
  if (!sessionId) return;

  const token = localStorage.getItem("authToken");
  if (!token) return;

  fetch(
    `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/verify-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    }
  )
   .then(res => res.json() as Promise<VerifyPaymentResponse>)
    .then(data => {
      if (!data.success) {
        console.error("Payment verification failed", data);
      }
    })
    .catch(err => {
      console.error("Verify payment error:", err);
    });
}, [paymentType, searchParams]);


  const handleGoToDashboard = () => {
    if (paymentType === 'auction') {
      if (listingType && listingId) {
        // Convert listingType to correct route path
        const routePath = getRoutePath(listingType);
        router.push(`/buyer/${routePath}/${listingId}`);
      } else {
        router.push('/');
      }
    } else {
      // Featured post payment - existing logic
      if (returnPath) {
        const selectedAdIds = selectedAds 
          ? selectedAds.split(',').filter(id => !isNaN(Number(id))).map(Number) 
          : [];
        const featuredQuery = selectedAdIds.length > 0 
          ? `?featured=${selectedAdIds.join(',')}` 
          : '';
        router.push(`${returnPath}${featuredQuery}`);
      } else {
        router.push('/');
      }
    }
  };

  const getSuccessMessage = () => {
    if (paymentType === 'auction') {
      return {
        title: "Auction Payment Successful!",
        description: "Thank you for your payment. You can now view the seller's contact information on the auction page."
      };
    }
    return {
      title: "Payment Successful!",
      description: "Thank you for your purchase. Your post has been featured and will now receive extra visibility."
    };
  };

  const { title, description } = getSuccessMessage();

  return (
    <>
      <Header />
      <section className="payment-page">
        <Image
          src={successImage}
          alt="Payment Success"
          width={100}
          height={100}
          className="payment-image w-16"
        />

        <div className="payment-title">
          <PartyPopper className="text-yellow-500 w-6 h-6" />
          <span>{title}</span>
        </div>

        <p className="payment-description">
          {description}
        </p>

        <button
          onClick={handleGoToDashboard}
          className="payment-button"
        >
          {paymentType === 'auction' ? 'View Auction' : 'Go to Dashboard'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      <Footer />
    </>
  );
}