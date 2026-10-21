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
            className="rounded-lg border border-slate-200/80 bg-white transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between p-4 text-left font-medium text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
              aria-expanded={isOpen}
            >
              <span className="text-sm md:text-base font-semibold">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                  isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
                )}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
