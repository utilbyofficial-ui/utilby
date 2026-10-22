"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [openIndexes, setOpenIndexes] = React.useState<number[]>([0]); // Open first FAQ by default

  const toggle = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        return (
          <div
            key={index}
            className={cn("rounded-2xl border bg-white transition-colors", isOpen ? "border-slate-300 shadow-soft" : "border-slate-200")}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-ink transition-colors hover:text-indigo-700"
              aria-expanded={isOpen}
            >
              <span className="text-[15px] font-semibold">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full text-slate-500 transition-transform duration-200",
                  isOpen && "rotate-180 text-ink"
                )}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600 animate-fade-up">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
