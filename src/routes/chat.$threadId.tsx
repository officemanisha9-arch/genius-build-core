import { createFileRoute, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Feather, Lightbulb, Code2 } from "lucide-react";
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
  type Thread,
  type ThreadMode,
} from "@/lib/threads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [{ title: "Conversation — Atelier" }],
  }),
  component: ChatPage,
});

const MODE_META: Record<
  ThreadMode,
  { label: string; icon: typeof Feather; placeholder: string }
> = {
  writer: {
    label: "Writer",
    icon: Feather,
    placeholder: "Draft a 200-word announcement for our new product…",
  },
  brainstorm: {
    label: "Brainstorm",
    icon: Lightbulb,
    placeholder: "Brainstorm 20 names for a slow-coffee subscription…",
  },
  code: {
    label: "Code",
    icon: Code2,
    placeholder: "Write a debounce hook in TypeScript…",
  },
};

function ChatPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  return <ChatWindow key={threadId} threadId={threadId} />;
}

function ChatWindow({ threadId }: { threadId: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const t = threadStore.get(threadId);
    if (!t) {
      setMissing(true);
      return;
    }
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

  const { messages, sendMessage, status, setMessages, error } = useChat({
    id: threadId,
    transport,
    messages: thread?.messages ?? [],
  });

  // Load thread messages on mount/change
  useEffect(() => {
    if (thread) setMessages(thread.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  // Persist when stream finishes
  const lastSavedRef = useRef<number>(0);
  useEffect(() => {
    if (!thread) return;
    if (status !== "ready" && status !== "error") return;
    if (messages.length === 0) return;
    const sig = messages.length + (messages[messages.length - 1]?.id?.length ?? 0);
    if (sig === lastSavedRef.current) return;
    lastSavedRef.current = sig;

    let title = thread.title;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser && (!title || title === "New conversation")) {
      const text = extractText(firstUser).trim().slice(0, 60);
      if (text) title = text;
    }
    threadStore.upsert({
      ...thread,
      title,
      messages,
      updatedAt: Date.now(),
    });
    emitThreadsChanged();
  }, [status, messages, thread]);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  if (missing) {
    return (
      <div className="grid flex-1 place-items-center p-8 text-muted-foreground">
        Conversation not found.
      </div>
    );
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
              description={Mode.placeholder}
            />
          )}
          {messages.map((m) => {
            const text = extractText(m);
            const isUser = m.role === "user";
            return (
              <div key={m.id} className="animate-fade-up">
                <Message from={m.role}>
                  <MessageContent
                    className={cn(
                      isUser
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent p-0 text-foreground",
                    )}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{text}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-pre:bg-secondary prose-pre:text-foreground prose-code:text-ember prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                  </MessageContent>
                </Message>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="py-2">
              <Shimmer>Thinking…</Shimmer>
            </div>
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
              placeholder={Mode.placeholder}
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

    </div>
  );
}

function extractText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}
