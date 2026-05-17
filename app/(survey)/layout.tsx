import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-white">
      <AnimatedBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
