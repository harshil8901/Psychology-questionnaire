"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/types/questionnaire";
import { LikertScale } from "./LikertScale";
import { SingleChoice } from "./SingleChoice";
import { TextQuestion } from "./TextQuestion";

interface QuestionRendererProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onContinue?: () => void;
  error?: string;
}

function QuestionRendererComponent({
  question,
  value,
  onChange,
  onBlur,
  onContinue,
  error,
}: QuestionRendererProps) {
  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <legend className="sr-only">{question.question}</legend>
      <motion.div>
        <label
          htmlFor={question.id}
          className="block text-lg font-medium leading-snug text-white sm:text-xl lg:text-2xl"
        >
          {question.question}
          {question.required && (
            <span className="ml-1 text-cyan-400" aria-hidden>
              *
            </span>
          )}
        </label>
        {question.description && (
          <p className="mt-2 text-sm text-slate-400">{question.description}</p>
        )}
      </motion.div>
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
              onBlur={onBlur}
              onContinue={onContinue}
              placeholder={question.placeholder}
              numericOnly={question.id === "age"}
            />
            {question.id === "age" && (
              <p id={`${question.id}-hint`} className="mt-2 text-xs text-slate-500">
                Enter your age in years (18–100)
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
    </motion.fieldset>
  );
}

export const QuestionRenderer = memo(QuestionRendererComponent);
