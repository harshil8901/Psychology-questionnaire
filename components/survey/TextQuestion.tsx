"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextQuestionProps {
  type: "text" | "textarea";
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  id: string;
}

export function TextQuestion({
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  id,
}: TextQuestionProps) {
  const className = cn(
    "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500",
    "focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
  );

  if (type === "textarea") {
    return (
      <Textarea
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={4}
        className={cn(className, "min-h-[120px] resize-none")}
      />
    );
  }

  return (
    <Input
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn(className, "h-12 text-base")}
    />
  );
}
