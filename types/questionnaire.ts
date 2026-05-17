export type QuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "likert";

export interface QuestionBase {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  analyticsKey?: string;
  order: number;
  /** Future: show when another question matches */
  showWhen?: {
    questionId: string;
    equals: string | string[];
  };
}

export interface TextQuestion extends QuestionBase {
  type: "text" | "textarea";
}

export interface SingleChoiceQuestion extends QuestionBase {
  type: "single_choice";
  options: string[];
}

export interface LikertQuestion extends QuestionBase {
  type: "likert";
  scale: string[];
}

export type Question = TextQuestion | SingleChoiceQuestion | LikertQuestion;

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  estimatedTime?: number;
  themeGradient?: string;
  questions: Question[];
}

export interface Questionnaire {
  id: string;
  title: string;
  estimatedTime: number;
  version: string;
  sections: SurveySection[];
}

export type SurveyStep =
  | { kind: "section_intro"; sectionId: string; sectionIndex: number }
  | {
      kind: "questions";
      sectionId: string;
      sectionIndex: number;
      questions: Question[];
      questionStartIndex: number;
    };
