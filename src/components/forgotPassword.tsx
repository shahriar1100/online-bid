'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import Image from 'next/image'
import forgot from "../app/assets/images/forgot.jpg"
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"
import { toast } from 'sonner'
interface PasswordFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}


const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
})

type FormData = z.infer<typeof formSchema>

export default function PasswordForm({ onClose, onSwitchToLogin }: PasswordFormProps) {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    })

    const onSubmit = async (data: FormData) => {
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });

            // Read raw response text
            const responseText = await res.text();
            console.log("Raw API response:", responseText);

            let result;
            try {
                result = JSON.parse(responseText);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                console.error("Failed to parse response:", responseText);
                throw new Error("Invalid response format");
            }
            if (result.success) {
                toast.success(result.message ?? "Password reset link sent!");
                onClose();
            } else {
                toast.error(result.error ?? "Failed to send password reset link");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        }
    }


    return (
        <>
            <div className="form-cont">
                <button
                    onClick={onClose}
                    className="cross-btn"
                >
                    <X className='w-auto h-5 md:h-6' />
                </button>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="left">
                    <div className="flex flex-col space-y-4">
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
                            <h2 className="popup-title">
                                Reset your password
                            </h2>
                            <p className='text-sm text-gray-600 dark:text-white my-1'>
                                A link will be sent to your registered mail id.
                            </p>
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

                        <button type="submit" className="btn authbtn">
                            Reset Password Link →
                        </button>

                        <p className="auth-footer-text">
                            Already a Member?{' '}
                            <span onClick={onSwitchToLogin} className="auth-footer-link">LOG IN</span>
                        </p>

                    </div>
                </form>

                {/* Right */}
                <div className="right">
                    <Image
                        src={forgot}
                        alt="Building"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            {/* {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg overflow-hidden w-[90%] max-w-3xl h-[500px] flex shadow-xl">
            <LoginForm onClose={closePopup} />
          </div>
        </div>
      )} */}
        </>
    )
}
