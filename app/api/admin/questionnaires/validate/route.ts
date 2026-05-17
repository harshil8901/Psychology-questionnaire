import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { validateQuestionnaireJson } from "@/lib/questionnaire-schema";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = validateQuestionnaireJson(body.config ?? body);

  if (!result.success) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  const q = result.data;
  const questionCount = q.sections.reduce((n, s) => n + s.questions.length, 0);

  return NextResponse.json({
    valid: true,
    summary: {
      id: q.id,
      title: q.title,
      sections: q.sections.length,
      questions: questionCount,
      estimatedTime: q.estimatedTime,
    },
  });
}
