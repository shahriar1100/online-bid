"use client";

import { ArrowRight, Clock3, MessageCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "src/components/ui/card";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";

interface QuestionCardProps {
  id: number;
  userName: string;
  question: string;
  createdAt: string;
  role?: "buyer" | "seller" | "admin";
  replyCount?: number;
  isAnswered?: boolean;
  onReply?: () => void;
  onViewReplies?: () => void;
}

const roleColors = {
  buyer:
    "bg-blue-500/10 text-blue-400 border border-blue-500/20 dark:text-blue-300",
  seller:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 dark:text-emerald-300",
  admin:
    "bg-violet-500/10 text-violet-400 border border-violet-500/20 dark:text-violet-300",
};

export default function QuestionCard({
  userName,
  question,
  createdAt,
  role = "buyer",
  replyCount = 0,
  isAnswered = false,
  onReply,
  onViewReplies,
}: QuestionCardProps) {
  return (
    <Card
      className="
      group
      overflow-hidden
      rounded-2xl
      border
      border-border/70
      bg-card/80
      backdrop-blur-md
      transition-all
      duration-300
      hover:-translate-y-1
      hover:border-violet-500/30
      hover:shadow-[0_20px_60px_rgba(109,94,248,.12)]
    "
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br
              from-violet-500
              to-fuchsia-500
              text-base
              font-semibold
              text-white
              shadow-lg
            "
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 className="font-semibold text-foreground">
                {userName}
              </h3>

              <div className="mt-1 flex items-center gap-2">
                <Badge className={roleColors[role]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {createdAt}
                </div>
              </div>
            </div>
          </div>

          {isAnswered && (
            <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              Answered
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p
          className="
          line-clamp-3
          text-[15px]
          leading-7
          text-muted-foreground
        "
        >
          {question}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/60 pt-5">
        <button
          onClick={onViewReplies}
          className="
          flex
          items-center
          gap-2
          text-sm
          text-muted-foreground
          transition-colors
          hover:text-violet-400
        "
        >
          <MessageCircle className="h-4 w-4" />
          {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
        </button>

        <Button
          variant="ghost"
          onClick={onReply}
          className="
          group/button
          text-violet-400
          hover:bg-violet-500/10
          hover:text-violet-300
        "
        >
          Reply

          <ArrowRight
            className="
            ml-1
            h-4
            w-4
            transition-transform
            duration-300
            group-hover/button:translate-x-1
          "
          />
        </Button>
      </CardFooter>
    </Card>
  );
}