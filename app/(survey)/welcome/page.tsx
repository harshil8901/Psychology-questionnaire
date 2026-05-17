import { WelcomeClient } from "./welcome-client";
import { loadQuestionnaire } from "@/lib/questionnaire-loader";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const preview = params.preview === "1";
  const questionnaire = await loadQuestionnaire(params.q);

  return <WelcomeClient questionnaire={questionnaire} preview={preview} />;
}
