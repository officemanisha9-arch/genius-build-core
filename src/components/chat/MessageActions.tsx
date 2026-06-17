import { Copy, RefreshCw, Pencil, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  role: "user" | "assistant" | "system";
  isLast: boolean;
  canRegenerate: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function MessageActions({
  text,
  role,
  isLast,
  canRegenerate,
  onRegenerate,
  onEdit,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const isUser = role === "user";

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <ActionBtn label={copied ? "Copied" : "Copy"} onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </ActionBtn>
      {isUser && onEdit && (
        <ActionBtn label="Edit" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </ActionBtn>
      )}
      {!isUser && canRegenerate && isLast && onRegenerate && (
        <ActionBtn label="Regenerate" onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
        </ActionBtn>
      )}
      {onDelete && (
        <ActionBtn label="Delete" onClick={onDelete} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </ActionBtn>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition hover:bg-secondary",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
