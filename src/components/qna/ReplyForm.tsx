"use client";

import { useState } from "react";

import { Textarea } from "src/components/ui/textarea";
import { Button } from "src/components/ui/button";
import { ENV } from "src/util/env";

interface ReplyFormProps {
  questionId: number;
  listingId: number;
  listingType: "realestate" | "automobile" | "business";
  onSuccess?: () => void;
}

export default function ReplyForm({
  questionId,
  listingId,
  listingType,
  onSuccess,
}: ReplyFormProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReply() {
    if (!answer.trim()) {
      alert("Please enter a reply.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");

      const res = await fetch(
        `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId,
            listingId,
            listingType,
            answer,
          }),
        },
      );

      const data: any = await res.json();

      if (data.success) {
        alert("Reply submitted successfully.");
        setAnswer("");
        onSuccess?.();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-4">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your reply..."
      />

      <Button onClick={handleReply} disabled={loading} className="mt-3">
        {loading ? "Submitting..." : "Submit Reply"}
      </Button>
    </div>
  );
}
