import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  language: string;
};

const EXT: Record<string, string> = {
  typescript: "ts", ts: "ts", javascript: "js", js: "js", tsx: "tsx", jsx: "jsx",
  python: "py", py: "py", json: "json", html: "html", css: "css", bash: "sh",
  shell: "sh", sh: "sh", sql: "sql", rust: "rs", go: "go", java: "java",
  c: "c", cpp: "cpp", "c++": "cpp", ruby: "rb", php: "php", yaml: "yml", md: "md",
};

export function CodeDrawer({ open, onOpenChange, code, language }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = EXT[language.toLowerCase()] ?? "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atelier-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl flex flex-col p-0 gap-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-mono text-sm uppercase tracking-wide">
              {language || "code"}
            </SheetTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" onClick={download}>
                <Download className="mr-1 h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto bg-[#1e1e2e]">
          <SyntaxHighlighter
            language={language || "text"}
            style={oneDark}
            customStyle={{ margin: 0, padding: "1.25rem", background: "transparent", fontSize: "0.85rem", minHeight: "100%" }}
            showLineNumbers
            wrapLongLines
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
