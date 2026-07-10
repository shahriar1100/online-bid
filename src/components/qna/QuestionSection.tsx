"use client";

import { useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Textarea } from "src/components/ui/textarea";
import QuestionList, { QuestionListRef } from "./QuestionList";

interface QuestionSectionProps {
  listingId: number;
  listingType: "realestate" | "automobile" | "business";
}

export default function QuestionSection({
  listingId,
  listingType,
}: QuestionSectionProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const questionListRef = useRef<QuestionListRef>(null);

  async function handleAskQuestion() {
    if (!question.trim()) {
      alert("Please enter your question.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId,
            listingType,
            question,
          }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setQuestion("");

        // Reload question list instantly
        questionListRef.current?.refresh();
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
    <section className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl">
      {/* Header */}

      <h1 className="text-5xl text-red-500">Q&A TEST</h1>

      <div className="flex flex-col gap-5 border-b border-border/60 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-400" />

            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Questions & Answers
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Ask questions publicly and get answers directly from the seller.
            Your question may also help future buyers before placing a bid.
          </p>
        </div>

        <div className="w-full lg:max-w-xl">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a public question..."
            className="mb-3"
          />

          <Button
            onClick={handleAskQuestion}
            disabled={loading}
            className="
              rounded-xl
              bg-gradient-to-r
              from-violet-600
              to-fuchsia-600
              px-6
              shadow-lg
              shadow-violet-500/20
            "
          >
            {loading ? "Submitting..." : "Ask Question"}
          </Button>
        </div>
      </div>

      {/* Questions */}

      <div className="p-6">
        <QuestionList
          ref={questionListRef}
          listingId={listingId}
          listingType={listingType}
        />
      </div>
    </section>
  );
}
