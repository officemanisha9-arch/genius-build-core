import { createFileRoute, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Feather, Lightbulb, Code2, Download, ImageIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  emitThreadsChanged,
  threadStore,
  imageStore,
  type Thread,
  type ThreadMode,
} from "@/lib/threads";
import { cn } from "@/lib/utils";
import { VoiceButton } from "@/components/VoiceButton";
import { MessageActions } from "@/components/chat/MessageActions";
import { CodeBlock } from "@/components/chat/CodeBlock";
import { CodeDrawer } from "@/components/chat/CodeDrawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({ meta: [{ title: "Conversation — Atelier" }] }),
  component: ChatPage,
});

const MODE_META: Record<
  ThreadMode,
  { label: string; icon: typeof Feather; placeholder: string }
> = {
  writer: { label: "Writer", icon: Feather, placeholder: "Draft a 200-word announcement…" },
  brainstorm: { label: "Brainstorm", icon: Lightbulb, placeholder: "Brainstorm 20 names…" },
  code: { label: "Code", icon: Code2, placeholder: "Write a debounce hook in TypeScript…" },
};

function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  return <ChatWindow key={threadId} threadId={threadId} />;
}

function ChatWindow({ threadId }: { threadId: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [missing, setMissing] = useState(false);
  const [drawer, setDrawer] = useState<{ code: string; language: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const t = threadStore.get(threadId);
    if (!t) { setMissing(true); return; }
    setThread(t);
  }, [threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, mode: thread?.mode ?? "writer", ...body },
        }),
      }),
    [thread?.mode],
  );

  const { messages, sendMessage, status, setMessages, error, regenerate } = useChat({
    id: threadId,
    transport,
    messages: thread?.messages ?? [],
  });

  useEffect(() => {
    if (thread) setMessages(thread.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  // Persist
  useEffect(() => {
    if (!thread) return;
    if (status !== "ready" && status !== "error") return;
    if (messages.length === 0) return;
    let title = thread.title;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser && (!title || title === "New conversation")) {
      const text = extractText(firstUser).trim().slice(0, 60);
      if (text) title = text;
    }
    threadStore.upsert({ ...thread, title, messages, updatedAt: Date.now() });
    emitThreadsChanged();
  }, [status, messages, thread]);

  // Auto-save images from tool results into image studio
  const savedImageIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const m of messages) {
      for (const p of m.parts as Array<Record<string, unknown>>) {
        const type = p.type as string | undefined;
        if (type && type.startsWith("tool-generate_image") && (p as { state?: string }).state === "output-available") {
          const out = (p as { output?: { url?: string; prompt?: string } }).output;
          const key = `${m.id}:${(p as { toolCallId?: string }).toolCallId}`;
          if (out?.url && !savedImageIdsRef.current.has(key)) {
            savedImageIdsRef.current.add(key);
            imageStore.add({
              id: crypto.randomUUID(),
              prompt: out.prompt ?? "",
              url: out.url,
              createdAt: Date.now(),
            });
          }
        }
      }
    }
  }, [messages]);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, [threadId, status]);

  if (missing) {
    return <div className="grid flex-1 place-items-center p-8 text-muted-foreground">Conversation not found.</div>;
  }
  if (!thread) return <div className="flex-1" />;

  const Mode = MODE_META[thread.mode];
  const ModeIcon = Mode.icon;
  const isLoading = status === "submitted" || status === "streaming";

  const submit = () => {
    const v = input.trim();
    if (!v || isLoading) return;
    sendMessage({ text: v });
    setInput("");
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const startEdit = (m: UIMessage) => {
    setEditingId(m.id);
    setEditValue(extractText(m));
  };

  const saveEdit = (m: UIMessage) => {
    const v = editValue.trim();
    if (!v) return;
    const idx = messages.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    // Drop this and all following, then resend
    const kept = messages.slice(0, idx);
    setMessages(kept);
    setEditingId(null);
    setEditValue("");
    sendMessage({ text: v });
  };

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="border-b border-border bg-card/40 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-secondary text-ember">
            <ModeIcon className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-medium">{thread.title}</div>
            <div className="text-xs text-muted-foreground">{Mode.label} mode</div>
          </div>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<ModeIcon className="h-8 w-8 text-ember" />}
              title={`${Mode.label} mode`}
              description={`${Mode.placeholder}  •  Try /image a sunset over mountains`}
            />
          )}
          {messages.map((m, idx) => {
            const text = extractText(m);
            const isUser = m.role === "user";
            const images = extractImages(m);
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="group animate-fade-up">
                <Message from={m.role}>
                  <MessageContent
                    className={cn(
                      isUser
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent p-0 text-foreground",
                    )}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[80px] bg-background text-foreground"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValue(""); }}>Cancel</Button>
                          <Button size="sm" onClick={() => saveEdit(m)}>Send</Button>
                        </div>
                      </div>
                    ) : isUser ? (
                      <div className="whitespace-pre-wrap">{text}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-code:text-ember prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const raw = String(children ?? "");
                              const isBlock = raw.includes("\n") || !!match;
                              if (!isBlock) {
                                return <code className={className} {...props}>{children}</code>;
                              }
                              return (
                                <CodeBlock
                                  code={raw.replace(/\n$/, "")}
                                  language={match?.[1] ?? "text"}
                                  onExpand={(code, language) => setDrawer({ code, language })}
                                />
                              );
                            },
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                        {images.map((img, i) => (
                          <div key={i} className="not-prose mt-3 overflow-hidden rounded-xl border border-border bg-card">
                            <img src={img.url} alt={img.prompt} className="w-full" />
                            <div className="flex items-center justify-between gap-2 p-2 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <ImageIcon className="h-3 w-3" /> {img.prompt.slice(0, 60)}
                              </span>
                              <a
                                href={img.url}
                                download={`atelier-${Date.now()}.png`}
                                className="inline-flex items-center gap-1 text-ember hover:underline"
                              >
                                <Download className="h-3 w-3" /> Save
                              </a>
                            </div>
                          </div>
                        ))}
                        {hasPendingImage(m) && (
                          <div className="not-prose mt-3 rounded-xl border border-dashed border-border p-6">
                            <Shimmer>Generating image…</Shimmer>
                          </div>
                        )}
                      </div>
                    )}
                  </MessageContent>
                </Message>
                {!isEditing && (text || images.length > 0) && (
                  <MessageActions
                    text={text}
                    role={m.role}
                    isLast={idx === lastAssistantIdx}
                    canRegenerate={!isLoading}
                    onRegenerate={() => regenerate()}
                    onEdit={isUser ? () => startEdit(m) : undefined}
                    onDelete={() => deleteMessage(m.id)}
                  />
                )}
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="py-2"><Shimmer>Thinking…</Shimmer></div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error.message || "Something went wrong."}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <PromptInput onSubmit={() => submit()}>
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${Mode.placeholder}  ·  /image <prompt>`}
            />
            <PromptInputFooter className="justify-between">
              <VoiceButton onTranscript={(t) => setInput((p) => (p ? p + " " + t : t))} />
              <PromptInputSubmit status={status} disabled={!input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <CodeDrawer
        open={!!drawer}
        onOpenChange={(o) => !o && setDrawer(null)}
        code={drawer?.code ?? ""}
        language={drawer?.language ?? "text"}
      />
    </div>
  );
}

function extractText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

type ToolImagePart = {
  type: string;
  state?: string;
  output?: { url?: string; prompt?: string; error?: string };
};

function extractImages(m: UIMessage): Array<{ url: string; prompt: string }> {
  const out: Array<{ url: string; prompt: string }> = [];
  for (const p of m.parts as unknown as ToolImagePart[]) {
    if (p.type?.startsWith("tool-generate_image") && p.state === "output-available" && p.output?.url) {
      out.push({ url: p.output.url, prompt: p.output.prompt ?? "" });
    }
  }
  return out;
}

function hasPendingImage(m: UIMessage): boolean {
  for (const p of m.parts as unknown as ToolImagePart[]) {
    if (p.type?.startsWith("tool-generate_image") && p.state !== "output-available") return true;
  }
  return false;
}
