import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { loadQuestionnaire } from "@/lib/questionnaire-loader";

export default async function SurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const preview = params.preview === "1";
  const questionnaire = await loadQuestionnaire(params.q);

  return <SurveyFlow questionnaire={questionnaire} preview={preview} />;
}
