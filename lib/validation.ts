import { z } from "zod";
import type { Question } from "@/types/questionnaire";

export const sessionSchema = z.object({
  sessionId: z.string().min(8).max(64),
  questionnaireId: z.string().min(1),
});

export const answerSchema = z.object({
  questionId: z.string().min(1).max(120),
  sectionId: z.string().min(1).max(120),
  value: z.string().max(5000),
});

export const submitSchema = z.object({
  sessionId: z.string().min(8),
  responseId: z.string().uuid(),
  turnstileToken: z.string().min(1).optional(),
  honeypot: z.string().max(0).optional(),
  answers: z.record(z.string(), z.string()).optional(),
});

export function validateAnswerForQuestion(
  question: Question,
  value: string
): string | null {
  if (!question.required && !value.trim()) return null;
  if (question.required && !value.trim()) {
    return "This question is required";
  }

  switch (question.type) {
    case "text":
      if (question.id === "age") {
        const age = parseInt(value, 10);
        if (Number.isNaN(age) || age < 18 || age > 100) {
          return "Please enter a valid age (18–100)";
        }
      }
      break;
    case "single_choice":
      if (!question.options.includes(value)) {
        return "Please select a valid option";
      }
      break;
    case "likert":
      if (!question.scale.includes(value)) {
        return "Please select a response";
      }
      break;
    default:
      break;
  }

  return null;
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 5000);
}
