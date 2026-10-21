import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast || !item.href ? (
              <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
