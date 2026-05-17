"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/questionnaire";
import { LikertScale } from "./LikertScale";
import { SingleChoice } from "./SingleChoice";
import { TextQuestion } from "./TextQuestion";

export type QuestionLayout = "demographic" | "survey";

interface QuestionRendererProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  layout?: QuestionLayout;
}

function QuestionRendererComponent({
  question,
  value,
  onChange,
  error,
  layout = "survey",
}: QuestionRendererProps) {
  const isDemographic = layout === "demographic";

  return (
    <fieldset className={cn("space-y-3", !isDemographic && "space-y-2.5")}>
      <legend className="sr-only">{question.question}</legend>
      <div>
        <label
          htmlFor={question.id}
          className={cn(
            "block font-medium leading-snug text-white",
            isDemographic ? "text-lg sm:text-xl" : "text-[15px] sm:text-base"
          )}
        >
          {question.question}
          {question.required && (
            <span className="ml-1 text-cyan-400/90" aria-hidden>
              *
            </span>
          )}
        </label>
        {question.description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {question.description}
          </p>
        )}
      </div>
      <div>
        {question.type === "likert" && (
          <LikertScale
            name={question.id}
            options={question.scale}
            value={value}
            onChange={onChange}
          />
        )}
        {question.type === "single_choice" && (
          <SingleChoice
            name={question.id}
            options={question.options}
            value={value}
            onChange={onChange}
          />
        )}
        {(question.type === "text" || question.type === "textarea") && (
          <>
            <TextQuestion
              id={question.id}
              type={question.type}
              value={value}
              onChange={onChange}
              placeholder={question.placeholder}
              numericOnly={question.id === "age"}
            />
            {question.id === "age" && (
              <p id={`${question.id}-hint`} className="mt-1.5 text-xs text-slate-500">
                Numbers only · age 18–100
              </p>
            )}
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export const QuestionRenderer = memo(QuestionRendererComponent);
