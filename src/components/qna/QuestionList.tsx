"use client";

import { useEffect, useState } from "react";

import QuestionCard from "./QuestionCard";
import { ENV } from "src/util/env";

interface Question {
  id: number;
  question: string;
  createdAt: number;
  userId: number;
  status: string;
  totalAnswers: number;
}

interface Props {
  listingId: number;
  listingType: "realestate" | "automobile" | "business";
}

export default function QuestionList({
  listingId,
  listingType,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [listingId, listingType]);

  async function loadQuestions() {
    try {
      const res = await fetch(
        `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/questions?listingId=${listingId}&listingType=${listingType}`
      );

      const data = await res.json();

      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Questions & Answers
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Ask questions publicly and get answers directly from the seller.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading...
        </p>
      )}

      {!loading && questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No questions yet.
        </p>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            id={question.id}
            userName={`User #${question.userId}`}
            role="buyer"
            question={question.question}
            createdAt={new Date(
              question.createdAt
            ).toLocaleString()}
            replyCount={question.totalAnswers}
            isAnswered={question.totalAnswers > 0}
          />
        ))}
      </div>
    </section>
  );
}