'use client'

import { useForm } from 'react-hook-form'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { ArrowUpRightFromSquare, Eye, EyeOff, Link2Off, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Loader from './loader'
import Image from 'next/image'
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"

interface FormData {
  newPassword: string
  confirmPassword: string
}

interface ResetPasswordResponse {
  success: boolean
  error?: string
  email?: string
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data: ResetPasswordResponse = await res.json();

        if (data.success && data.email) {
          setIsValid(true);
          setEmail(data.email);
        } else {
          toast.error(data.error || "Invalid or expired token");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to validate token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Missing token");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Fixed: Use /api/auth/reset-password instead of /auth/reset-password
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      });

      const result: ResetPasswordResponse = await res.json();

      if (result.success) {
        toast.success("Password updated successfully!");
        router.push("/?login=true"); // Redirect to home with login modal
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          {/* <Loader2 className="animate-spin mx-auto mb-4" size={32} /> */}
          <Loader />
          <p className='text-base'>Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border">
          <Link2Off className='w-auto h-10 mx-auto text-red-600' />
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Link</h1>
          <p className="text-gray-700 dark:text-white text-sm md:text-base mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn authbtn flex justify-center items-center mx-auto gap-2"
          >
            Go to Home
            <ArrowUpRightFromSquare className='w-auto h-4' />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border">
        <div className="mb-8">
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
          <h1 className="text-gray-700 dark:text-white text-sm md:text-base">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Enter a new password for <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
          <div className='mb-4'>
            <label className="form-label">NEW PASSWORD</label>
            <div className="relative mt-2">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter new password"
                {...register("newPassword", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
                className="custom-input"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="error-text">{errors.newPassword.message}</p>
            )}
          </div>

          <div className='mb-4'>
            <label className="form-label">CONFIRM PASSWORD</label>
            <input
              type="password"
              placeholder="Confirm new password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (val) =>
                  val === watch("newPassword") || "Passwords do not match"
              })}
              className="custom-input mt-2"
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn authbtn flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Resetting...
              </>
            ) : (
              "Reset Password →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          {/* <Loader2 className="animate-spin" size={32} /> */}
          <Loader />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}