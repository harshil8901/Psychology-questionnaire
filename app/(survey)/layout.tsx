import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      {children}
    </div>
  );
}
