export interface ResponseRow {
  id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  progress_percentage: number;
  is_completed: boolean;
  session_id: string;
  questionnaire_id: string;
  questionnaire_version: string;
  consent_accepted_at: string | null;
  started_at: string | null;
  last_section_id: string | null;
  last_question_id: string | null;
  current_step_index: number;
  demographic_snapshot: Record<string, string> | null;
}

export interface AnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  section_id: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEventRow {
  id: string;
  response_id: string | null;
  event_type: string;
  section_id: string | null;
  question_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
