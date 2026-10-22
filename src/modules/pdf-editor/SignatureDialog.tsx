"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { X, Eraser, Check, PenTool, Type } from "lucide-react";

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSignature: (dataUrl: string) => void;
}

export function SignatureDialog({
  isOpen,
  onClose,
  onInsertSignature,
}: SignatureDialogProps) {
  const [tab, setTab] = React.useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = React.useState("");
  const [typedFont, setTypedFont] = React.useState<"cursive" | "serif" | "sans-serif">("cursive");
  const [inkColor, setInkColor] = React.useState("#1e293b"); // dark navy/black
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const lastPoint = React.useRef<{ x: number; y: number } | null>(null);
  const hasStrokes = React.useRef(false);
  const [error, setError] = React.useState("");

  // Clear canvas
  const clearCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
  }, []);

  React.useEffect(() => {
    if (isOpen && tab === "draw") {
      setTimeout(clearCanvas, 50);
    }
  }, [isOpen, tab, clearCanvas]);

  if (!isOpen) return null;

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    isDrawing.current = true;
    setError("");
    lastPoint.current = { x, y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPoint.current = { x, y };
    hasStrokes.current = true;
  };

  const stopDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    lastPoint.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleApply = () => {
    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasStrokes.current) {
        setError("Please draw your signature first.");
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      onInsertSignature(dataUrl);
      onClose();
    } else {
      if (!typedName.trim()) {
        setError("Please type your name or initials.");
        return;
      }
      // Render typed text to a clean transparent canvas
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = inkColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let fontSpec = "italic 48px Georgia, serif";
      if (typedFont === "cursive") {
        fontSpec = "italic 56px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
      } else if (typedFont === "sans-serif") {
        fontSpec = "italic 46px system-ui, sans-serif";
      }
      ctx.font = fontSpec;
      ctx.fillText(typedName.trim(), 300, 100);

      const dataUrl = canvas.toDataURL("image/png");
      onInsertSignature(dataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-lift overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-pdf" />
            <h3 className="font-semibold text-lg text-foreground">Add Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Color selector */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 border-b border-border/50">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setTab("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === "draw"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw Signature
            </button>
            <button
              onClick={() => setTab("type")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === "type"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type Signature
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Color:</span>
            {[
              { id: "#1e293b", label: "Navy" },
              { id: "#0f172a", label: "Black" },
              { id: "#1d4ed8", label: "Blue" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setInkColor(c.id)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  inkColor === c.id ? "scale-110 border-foreground shadow" : "border-transparent"
                }`}
                style={{ backgroundColor: c.id }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tab === "draw" ? (
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-border rounded-xl bg-slate-50 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  onPointerDown={startDraw}
                  onPointerMove={drawMove}
                  onPointerUp={stopDraw}
                  onPointerCancel={stopDraw}
                  className="w-full h-44 cursor-crosshair touch-none block"
                />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-xs text-muted-foreground/60 border-t border-border/40 pt-1">
                  <span>Sign on the line above</span>
                  <span>100% Client-side</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear canvas
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Type your full name or initials
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => {
                    setTypedName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground block">
                  Select signature style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cursive", label: "Cursive Script", sample: "Brush" },
                    { id: "serif", label: "Classic Serif", sample: "Formal" },
                    { id: "sans-serif", label: "Modern Clean", sample: "Clean" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTypedFont(style.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        typedFont === style.id
                          ? "border-ink bg-slate-100 text-foreground"
                          : "border-border hover:border-border/80 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold capitalize">{style.sample}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {typedName && (
                <div className="p-4 rounded-xl border border-border bg-slate-50 flex items-center justify-center min-h-[90px]">
                  <span
                    style={{
                      color: inkColor,
                      fontFamily:
                        typedFont === "cursive"
                          ? "'Brush Script MT', 'Dancing Script', cursive, sans-serif"
                          : typedFont === "serif"
                          ? "Georgia, serif"
                          : "system-ui, sans-serif",
                      fontStyle: "italic",
                      fontSize: "2rem",
                    }}
                  >
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
          {error && <p className="mr-auto text-xs font-medium text-rose-600">{error}</p>}
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} >
            <Check className="w-4 h-4 mr-1.5" />
            Apply Signature
          </Button>
        </div>
      </div>
    </div>
  );
}
