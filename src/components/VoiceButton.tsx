import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useEffect } from "react";
import { toast } from "sonner";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  className?: string;
  size?: "sm" | "icon-sm" | "icon" | "default";
  continuous?: boolean;
  autoSubmit?: () => void;
}

export function VoiceButton({
  onTranscript,
  onInterim,
  className,
  size = "icon-sm",
  continuous = false,
  autoSubmit,
}: VoiceButtonProps) {
  const { listening, supported, toggle, interim } = useVoiceInput({
    continuous,
    onFinal: (text) => {
      onTranscript(text);
      autoSubmit?.();
    },
    onInterim,
    onError: (_code, message) => toast.error(message),
  });

  useEffect(() => {
    if (interim && onInterim) onInterim(interim);
  }, [interim, onInterim]);

  const handleClick = () => {
    if (!supported) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    toggle();
  };


  return (
    <Button
      type="button"
      variant={listening ? "default" : "ghost"}
      size={size}
      onClick={handleClick}
      className={cn(
        "relative transition-all",
        listening && "bg-ember text-cream hover:bg-ember/90",
        className,
      )}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      title={listening ? "Listening… click to stop" : "Speak your prompt"}
    >
      {listening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 opacity-70" />}
      {listening && (
        <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ember" />
        </span>
      )}
    </Button>
  );
}
