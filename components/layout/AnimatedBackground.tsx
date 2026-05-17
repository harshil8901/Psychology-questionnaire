export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#020308]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/90 via-[#020308] to-[#010204]" />
      <div className="ambient-glow absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-cyan-600/[0.07] blur-[100px]" />
      <div className="ambient-glow-delayed absolute -right-1/4 top-1/4 h-[360px] w-[360px] rounded-full bg-indigo-600/[0.06] blur-[90px]" />
      <div className="absolute bottom-0 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-violet-700/[0.05] blur-[80px]" />
    </div>
  );
}
