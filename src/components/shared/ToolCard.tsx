import Link from "next/link";
import type { ToolMeta } from "@/lib/tools-registry";
import { ToolGlyph } from "@/components/shared/ToolGlyph";
import { cn } from "@/lib/utils";

/** The standard tool card used on the homepage, category pages and the /tools directory. */
export function ToolCard({ tool, compact = false }: { tool: ToolMeta; compact?: boolean }) {
  const body = (
    <>
      <ToolGlyph tool={tool} size={compact ? "sm" : "md"} />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-ink">
          {tool.name}
          {!tool.isReady && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Coming soon</span>}
        </span>
        <span className="mt-1 block text-sm leading-snug text-slate-600">{tool.shortDescription}</span>
      </span>
    </>
  );
  const cls = cn(
    "flex items-start gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-soft transition-all duration-200",
    tool.isReady ? "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift" : "opacity-70"
  );
  return tool.isReady ? (
    <Link href={`/tools/${tool.slug}`} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls} aria-disabled="true">
      {body}
    </div>
  );
}
