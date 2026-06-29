'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import login from "../app/assets/images/login.png"
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"
import { toast } from 'sonner'
type User = {
  id: string;
  email: string;
  is_verified: number;
  userType: "buyer" | "seller";
};

interface SignupFormProps {
  onClose: () => void
  onSwitchToLogin: () => void
  onSuccessLogin: (userData: User) => void;
}
const phoneRegex = /^(\+?[1-9]{1,3}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string()
    .min(1, { message: 'Phone number is required' })
    .regex(phoneRegex, { message: 'Invalid phone number format' })
    .refine((val) => {
      // Extract only digits and check length
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 10;
    }, { message: 'Phone number must be at least 10 digits' })
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length <= 15;
    }, { message: 'Phone number must not exceed 15 digits' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  registrationType: z.enum(['Buyer', 'Seller'], {
    message: 'Please select a registration type',
  }),
})

type FormData = z.infer<typeof formSchema>

// Only one type needed now
type SignupResponse = {
  success: boolean;
  error?: string;
  userId?: string;
  email?: string;
  name?: string;
  verifyUrl?: string;
  userType?: "buyer" | "seller";
  verificationSent?: boolean;
  warning?: string;
};

export default function SignupForm({ onClose, onSwitchToLogin }: SignupFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/signup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result: SignupResponse = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || "Signup failed");
        return;
      }

      // Check if verification email was sent
      if (result.verificationSent) {
        toast.success("Signup successful! Check your email for the verification link.");
      } else if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Account created successfully! Please check your email.");
      }
      // Switch to login form
      onSwitchToLogin();
    } catch (err) {
      console.error("Error during signup:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="form-cont">
      <button
        onClick={onClose}
        className="cross-btn"
      >
        <X className='w-auto h-5 md:h-6' />
      </button>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="left"
      >
        <div className="flex flex-col space-y-2.5 overflow-y-auto custom-scrollbar">
          <div>
            <span className="logo mb-10">
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

          <div>
            <label className="form-label">NAME</label>
            <input
              type="text"
              {...register('name')}
              placeholder="John Doe"
              className="custom-input"
            />
            {errors.name && (
              <p className="error-text">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">EMAIL</label>
            <input
              type="email"
              {...register('email')}
              placeholder="johndoe@email.com"
              className="custom-input"
            />
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">PHONE NUMBER</label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+1 (234) 567-8900"
              className="custom-input"
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="error-text">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">PASSWORD</label>
            <div className="relative">
              <input
                type={passwordVisible ? 'text' : 'password'}
                {...register('password')}
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
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">REGISTRATION TYPE</label>
            <select
              {...register('registrationType')}
              className="custom-input"
              defaultValue=""
            >
              <option value="" disabled>
                Choose your type
              </option>
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
            </select>
            {errors.registrationType && (
              <p className="error-text">
                {errors.registrationType.message}
              </p>
            )}
          </div>

          {/* <button
            type="submit"
            className="btn authbtn"
          >
            SIGN UP →
          </button> */}
          <button
            type="submit"
            disabled={loading}
            className={`btn authbtn flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Signing up...
              </>
            ) : (
              'SIGN UP →'
            )}
          </button>

          <p className="auth-footer-text">
            Already a Member?{' '}
            <span
              onClick={onSwitchToLogin}
              className="auth-footer-link"
            >
              LOG IN
            </span>
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
  )
}
