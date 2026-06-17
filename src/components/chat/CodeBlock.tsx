import { useState } from "react";
import { Copy, Check, Maximize2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

type Props = {
  code: string;
  language?: string;
  onExpand?: (code: string, language: string) => void;
};

export function CodeBlock({ code, language = "text", onExpand }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#1e1e2e]">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-3 py-1.5 text-xs">
        <span className="font-mono text-muted-foreground">{language}</span>
        <div className="flex items-center gap-1">
          {onExpand && (
            <button
              type="button"
              onClick={() => onExpand(code, language)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              aria-label="Expand code"
            >
              <Maximize2 className="h-3 w-3" /> Expand
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.85rem",
        }}
        wrapLongLines
      >
        {code.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
