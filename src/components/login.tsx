'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import login from "../app/assets/images/login.png"
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"
import { toast } from 'sonner'
interface LoginFormProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSwitchToPassword: () => void;
  onSuccessLogin: (userData: { id: string; email: string; name?: string; is_verified: number; userType: "buyer" | "seller", token?: string; }) => void;
  onAuthChange?: () => void
}

interface LoginFormData {
  email: string;
  password: string;
}


interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_verified: boolean;
    userType: "buyer" | "seller";
  };
  error?: string;
  token?: string;
}

export default function LoginForm({ onClose, onSwitchToSignup, onSwitchToPassword, onSuccessLogin, onAuthChange }: LoginFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await res.json();

      if (result.success && result.user) {
        const userType = result.user.role?.toLowerCase() === "seller" ? "seller" : "buyer";
        console.log('Login successful:', result);
        console.log("LOGIN USER =", result.user);
console.log("TOKEN =", result.token);
        onSuccessLogin({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          is_verified: result.user.is_verified ? 1 : 0,
          userType: userType,
          token: result.token
        })
        if (onAuthChange) {
          onAuthChange()
        }
      } else {
        console.error('Login failed:', result.error);
        toast.error(result.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false)
    }
  };


  return (
    <>
      <div className="form-cont">
        <button
          onClick={onClose}
          className="cross-btn"
        >
          <X className='w-auto h-5 md:h-6' />
        </button>

        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} className="left">
          <div className="flex flex-col">
            <div className='mb-10'>
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
              <p className='text-gray-700 dark:text-white text-sm md:text-base'>Welcome back.</p>
              <h2 className="popup-title">
                Continue with your bid.
              </h2>
            </div>

            <div className='mb-4'>
              <label className="form-label">EMAIL</label>
              <input
                type="email"
                placeholder="johndoe@email.com"
                className="custom-input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div className='mb-4'>
              <label className="form-label">PASSWORD</label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="custom-input"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
              <div className="flex justify-end mt-1">
                <Link href="#" onClick={onSwitchToPassword} className="text-sm underline text-gray-600 dark:text-white">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* <button type="submit" className="btn authbtn">
              LOG IN →
            </button> */}
            <button
              type="submit"
              className="btn authbtn flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Logging in...
                </>
              ) : (
                "LOG IN →"
              )}
            </button>

            <p className="auth-footer-text">
              Are you a Newbie?{' '}
              <span onClick={onSwitchToSignup} className="auth-footer-link">GET STARTED IT&#39;S FREE</span>
            </p>
          </div>
        </form>

        {/* Right */}
        <div className="right">
          <Image
            src={login}
            alt="Building"
            fill
            className="object-cover"
          />
        </div>
      </div>
      {/* {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg overflow-hidden w-[90%] max-w-3xl h-[500px] flex shadow-xl">
            <SignupForm onClose={closePopup} />
          </div>
        </div>
      )} */}
    </>

  )
}
