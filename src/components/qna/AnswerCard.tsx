"use client";

import { Clock3, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "src/components/ui/card";

import { Badge } from "src/components/ui/badge";


interface AnswerCardProps {
  userName: string;
  answer: string;
  createdAt: string;
  role?: "seller" | "admin" | "moderator";
}

const roleColors = {
  seller: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  admin: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  moderator: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};


export default function AnswerCard({
  userName,
  answer,
  createdAt,
  role = "seller",
}: AnswerCardProps) {
  return (
    <Card className="ml-10 border-l-4 border-l-emerald-500 bg-emerald-500/5">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{userName}</h4>

                <Badge className={roleColors[role]}>
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {role}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3 w-3" />

                {createdAt}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 leading-7 text-muted-foreground">{answer}</p>
      </CardContent>
    </Card>
  );
}
