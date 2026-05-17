"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextQuestionProps {
  type: "text" | "textarea";
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
  numericOnly?: boolean;
}

export function TextQuestion({
  type,
  value,
  onChange,
  placeholder,
  id,
  numericOnly = false,
}: TextQuestionProps) {
  const className = cn(
    "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500",
    "focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20",
    "text-base"
  );

  const handleChange = (raw: string) => {
    if (numericOnly) {
      onChange(raw.replace(/\D/g, "").slice(0, 3));
      return;
    }
    onChange(raw);
  };

  if (type === "textarea") {
    return (
      <Textarea
        id={id}
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={cn(className, "min-h-[100px] resize-none")}
      />
    );
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode={numericOnly ? "numeric" : "text"}
      autoComplete={numericOnly ? "off" : undefined}
      pattern={numericOnly ? "[0-9]*" : undefined}
      value={value ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      maxLength={numericOnly ? 3 : undefined}
      aria-describedby={numericOnly ? `${id}-hint` : undefined}
      className={cn(className, "h-12")}
    />
  );
}
