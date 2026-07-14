"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import QuestionCard from "./QuestionCard";
import { ENV } from "src/util/env";

interface Question {
  id: number;
  question: string;
  createdAt: number;
  userId: number;
  userName: string;
  status: string;
  totalAnswers: number;
  role: string;
}

interface Props {
  listingId: number;
  listingType: "realestate" | "automobile" | "business";
}

export interface QuestionListRef {
  refresh: () => void;
}

const QuestionList = forwardRef<QuestionListRef, Props>(
  ({ listingId, listingType }, ref) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadQuestions() {
      try {
        setLoading(true);

        const res = await fetch(
          `${ENV.NEXT_PUBLIC_WRANGLER_API_URL}/api/questions?listingId=${listingId}&listingType=${listingType}`,
        );

        const data = (await res.json()) as {
          success: boolean;
          questions: Question[];
        };
console.log(data.questions);
        if (data.success) {
console.log(data.questions[0]);
console.log(data.questions[1]);
          setQuestions(data.questions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    useImperativeHandle(ref, () => ({
      refresh: loadQuestions,
    }));

    useEffect(() => {
      loadQuestions();
    }, [listingId, listingType]);

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

        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!loading && questions.length === 0 && (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        )}

        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              id={question.id}
              listingId={listingId}
              listingType={listingType}
              userName={question.userName}
              role={
                question.role?.toLowerCase() === "seller" ? "seller" : "buyer"
              }
              question={question.question}
              createdAt={new Date(question.createdAt).toLocaleString()}
              replyCount={question.totalAnswers}
              isAnswered={question.totalAnswers > 0}
            />
          ))}
        </div>
      </section>
    );
  },
);

QuestionList.displayName = "QuestionList";

export default QuestionList;
