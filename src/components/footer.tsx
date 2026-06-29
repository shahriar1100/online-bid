'use client';
import Image from "next/image";
import Link from "next/link";
import { FaInstagram, FaReddit } from "react-icons/fa";
import SignupForm from './signup';
import LoginForm from './login';
import PasswordForm from './forgotPassword';
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import paymentcard from "../app/assets/images/payments-card.png"
// import logo from "../app/assets/images/tops.png"
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"

export default function Footer() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login' | 'forgot'>('signup');
  const pathname = usePathname();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserType(user.userType);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  const openSignup = () => {
    setMode('signup');
    setIsPopupOpen(true);
  };

  const openLogin = () => {
    setMode('login');
    setIsPopupOpen(true);
  };

  const openForgot = () => {
    setMode('forgot');
    setIsPopupOpen(true);
  };

  const closePopup = () => setIsPopupOpen(false);

  // Hide footer for sellers
  if (userType === 'seller' || pathname.startsWith('/seller')) {
    return null;
  }

  // Height class for popup
  const getHeightClass = () => {
    if (mode === 'signup') return 'h-[607px]';
    if (mode === 'login') return 'h-[500px]';
    if (mode === 'forgot') return 'h-[500px]';
    return '';
  };

  return (
    <>
      <footer className="footer">
        <div className="mx-auto container">
          <div className="flex justify-between items-start flex-wrap md:flex-nowrap gap-8">
            {/* Company Info */}
            <div className="w-full md:w-[40%]">
              <div className="flex items-center">
                <span className="logo mb-2.5">
                  <Image
                    src={logoDark}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img dark:hidden"
                  />
                  <Image
                    src={logoWhite}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img hidden dark:block"
                  />
                </span>
              </div>

              {/* <p className="footer-desc">
                It is a long established fact that a reader will be distracted by the readable content of a
                page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less
                normal distribution of letters.
              </p> */}

              <div className="flex space-x-3">
                <Link target="_blank" href="https://www.instagram.com/ibids365" className="social-container">
                  <FaInstagram size={16} />
                </Link>
                <Link target="_blank" href="https://www.reddit.com/user/IBIDS365/" className="social-container">
                  <FaReddit size={16} />
                </Link>
                {/* <Link href="#" className="social-container">
                  <FaTwitter size={16} />
                </Link> */}
              </div>
            </div>

            <div className="w-full md:w-[60%] flex justify-start md:justify-evenly items-start gap-10">
              {/* Quick Links */}
              {/* <div>
                <h4 className="footer-link-heading">
                  Quick Links
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#"
                      onClick={openLogin}
                      className="footer-link group"
                    >
                      <FaArrowRight className="mr-2 text-[#333b48] dark:text-white text-xs group-hover:translate-x-1 transition-transform" />
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      onClick={openSignup}
                      className="footer-link group"
                    >
                      <FaArrowRight className="mr-2 text-[#333b48] dark:text-white text-xs group-hover:translate-x-1 transition-transform" />
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="footer-link group"
                    >
                      <FaArrowRight className="mr-2 text-[#333b48] dark:text-white text-xs group-hover:translate-x-1 transition-transform" />
                      Auction
                    </Link>
                  </li>
                </ul>
              </div> */}

              {/* Help Section */}
              <div>
                <h4 className="footer-link-heading">
                  Help Center
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/faq" className="footer-link">
                      Frequently Asked Questions
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact-us" className="footer-link">
                      Contact us
                    </Link>
                  </li>
                  {/* <li>
                    <Link href="/help/auction" className="footer-link">
                      How to bid an auctions
                    </Link>
                  </li>
                  <li>
                    <Link href="/help/tips-and-tricks" className="footer-link">
                      Tips & Tricks
                    </Link>
                  </li>
                  <li>
                    <Link href="/help/faq" className="footer-link">
                      Frequently Asked Questions
                    </Link>
                  </li>
                  <li>
                    <Link href="/help/bid-pack" className="footer-link">
                      What is Bid Pack?
                    </Link>
                  </li>
                  <li>
                    <Link href="/help/time-as-highest-bidder" className="footer-link">
                      What is Time as highest Bidder?
                    </Link>
                  </li> */}
                </ul>
              </div>

              {/* About Section */}
              <div>
                <h4 className="footer-link-heading">
                  Company
                </h4>
                <ul className="space-y-3">

                  {/* <li>
                    <Link href="#" className="footer-link">
                      Winners
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      href="/terms-of-service"
                      className="footer-link">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="footer-link">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="footer-link">
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/auction-rules-bidding-policy" className="footer-link">
                      Auction Rules & Bidding Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-slate-300 mt-10 py-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs md:text-sm dark:border-slate-700 dark:text-slate-400">
            <p className="mb-4 md:mb-0">
              © 2026 IBIDS365. All rights reserved.
            </p>
            <div className="flex items-center">
              <span className="mr-3">We accept:</span>
              <Image
                src={paymentcard}
                alt="Payment methods"
                width={180}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Popups */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div
            className={`custom-popup-container ${getHeightClass()} `}
          >
            {mode === 'signup' && (
              <SignupForm
                onClose={closePopup}
                onSwitchToLogin={openLogin}
                onSuccessLogin={() => {
                  console.log("User successfully signed up!");
                }}
              />
            )}
            {mode === 'login' && (
              <LoginForm
                onClose={closePopup}
                onSwitchToSignup={openSignup}
                onSwitchToPassword={openForgot}
                onSuccessLogin={() => {
                  console.log("User successfully signed up!");
                }}
              />
            )}
            {mode === 'forgot' && (
              <PasswordForm onClose={closePopup} onSwitchToLogin={openLogin} />
            )}
          </div>
        </div>
      )}
    </>
  );
}