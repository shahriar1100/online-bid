"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Label } from "src/components/ui/label"
import { toast } from "sonner"

const schema = z.object({
    subject: z.string().min(1, "Please select a subject"),
    email: z.string().email("Enter a valid email"),
    name: z.string().min(2, "Name is required"),
    message: z.string().min(5, "Message should be at least 5 characters"),
})

type FormData = z.infer<typeof schema>

export default function ContactForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

   const onSubmit = async (data: FormData) => {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json() as { success: boolean; error?: string };
    if (result.success) {
      toast.success("Message sent! We'll get back to you soon.");
      reset();
    } else {
      toast.error(result.error || "Failed to send message");
    }
  } catch {
    toast.error("Something went wrong. Please try again.");
  }
};

    return (
        <div className="flex justify-center items-center mb-11">
            <div className="w-full max-w-lg bg-white rounded-md shadow p-8 dark:bg-gray-800">
                <h2 className="section-title pb-8">
                    Open a support ticket
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                    <div>
                        <Label className="custom-label">
                            Subject:
                        </Label>
                        <select
                            {...register("subject")}
                            className="custom-input"
                        >
                            <option value="">-- Please select a subject! --</option>
                            <option value="account">How does bidding work?</option>
                            <option value="payment">Delivery status of my order</option>
                            <option value="technical">How can I return an item?</option>
                            <option value="general">How can I get a return?</option>
                            <option value="general">My payment did not go through</option>
                            <option value="general">Username,Password,Address</option>
                            <option value="general">Technical question / problem</option>
                            <option value="general">Other inquiries</option>
                        </select>
                        {errors.subject && (
                            <p className="error-text">{errors.subject.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="custom-label">
                            Email Address:
                        </Label>
                        <input
                            type="email"
                            {...register("email")}
                            placeholder="your@email.com"
                            className="custom-input"
                        />
                        {errors.email && (
                            <p className="error-text">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="custom-label">
                            Your name:
                        </Label>
                        <input
                            type="text"
                            {...register("name")}
                            placeholder="Your name"
                            className="custom-input"
                        />
                        {errors.name && (
                            <p className="error-text">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="custom-label">
                            Message:
                        </Label>
                        <textarea
                            {...register("message")}
                            placeholder="How can we help?"
                            rows={4}
                            className="custom-input input-textarea"
                        />
                        {errors.message && (
                            <p className="error-text">{errors.message.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#333B48] text-white rounded-full hover:bg-[#4a5363] transition w-full"
                    >
                        Submit Query
                    </button>
                </form>
            </div>
        </div>
    )
}
