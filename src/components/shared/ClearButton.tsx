"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RotateCcw } from "lucide-react";

interface ClearButtonProps {
  onClear: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ClearButton({ onClear, disabled = false, label = "Clear", className }: ClearButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onClear}
      disabled={disabled}
      className={className}
      title="Clear text"
    >
      <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
      <span>{label}</span>
    </Button>
  );
}
