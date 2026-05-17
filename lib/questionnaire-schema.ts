import { z } from "zod";

const showWhenSchema = z.object({
  questionId: z.string().min(1),
  equals: z.union([z.string(), z.array(z.string())]),
});

const questionBase = {
  id: z.string().min(1).max(120),
  question: z.string().min(1).max(2000),
  description: z.string().max(2000).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().max(500).optional(),
  analyticsKey: z.string().max(120).optional(),
  order: z.number().int().min(0),
  showWhen: showWhenSchema.optional(),
};

const textQuestionSchema = z.object({
  ...questionBase,
  type: z.enum(["text", "textarea"]),
});

const singleChoiceSchema = z.object({
  ...questionBase,
  type: z.literal("single_choice"),
  options: z.array(z.string().min(1)).min(2),
});

const likertSchema = z.object({
  ...questionBase,
  type: z.literal("likert"),
  scale: z.array(z.string().min(1)).min(2),
});

const questionSchema = z.discriminatedUnion("type", [
  textQuestionSchema,
  singleChoiceSchema,
  likertSchema,
]);

const sectionSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  icon: z.string().max(50).optional(),
  estimatedTime: z.number().int().min(1).optional(),
  themeGradient: z.string().max(100).optional(),
  questions: z.array(questionSchema).min(1),
});

export const questionnaireSchema = z.object({
  id: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens"),
  title: z.string().min(1).max(500),
  estimatedTime: z.number().int().min(1).max(180),
  version: z.string().min(1).max(20),
  sections: z.array(sectionSchema).min(1),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;

export function validateQuestionnaireJson(
  data: unknown
): { success: true; data: QuestionnaireInput } | { success: false; error: string } {
  const result = questionnaireSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { success: false, error: msg };
  }
  return { success: true, data: result.data };
}
