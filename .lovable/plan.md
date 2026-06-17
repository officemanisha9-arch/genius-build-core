## Goal
- Apna OpenAI API key use karein (Lovable Gateway ki jagah) for chat + images.
- Chat me copy, regenerate, edit & resend, delete actions add karein.
- Code blocks ke liye side drawer (full code, copy, download).
- Chat ke andar image generation — auto-detect aur `/image` command dono.

## 1. OpenAI key setup
- `secrets--add_secret` se `OPENAI_API_KEY` request karunga (user securely paste karega).
- Naya helper `src/lib/openai.server.ts` — `getOpenAIKey()` jo `process.env.OPENAI_API_KEY` ya `.env.local` fallback se padhe (existing `config.server.ts` pattern jaisa).
- `src/lib/ai-gateway.server.ts` ko OpenAI direct point karne wale provider me badalna:
  - `createOpenAICompatible({ baseURL: "https://api.openai.com/v1", headers: { Authorization: "Bearer <key>" } })`.

## 2. Chat backend (`src/routes/api/chat.ts`)
- Model `openai/gpt-4o-mini` (chat) — OpenAI direct call.
- Naya tool `generate_image` (AI SDK `tool` + Zod schema) jo OpenAI `images/generations` (`gpt-image-1`) call karta hai aur `{ url, prompt }` return karta hai. `stopWhen: stepCountIs(50)`.
- System prompt me bataya jayega ki image requests pe tool use kare. `/image <prompt>` command bhi tool call trigger kare.

## 3. Image route
- `src/routes/api/generate-image.ts` ko OpenAI `https://api.openai.com/v1/images/generations` pe switch karna (`gpt-image-1`, `quality: "low"`, base64→data URL return).
- Standalone images page (`/images`) wahi endpoint use karega — backward compatible.

## 4. Chat UI (`src/routes/chat.$threadId.tsx`)
- Har message ke neeche action bar:
  - **Copy** — text clipboard, toast.
  - **Regenerate** (assistant only, last message) — last assistant message drop, `regenerate()` from `useChat`.
  - **Edit & resend** (user only) — inline textarea, save → us message ke baad sab trim karke `sendMessage` dobara.
  - **Delete** — message remove + thread persist.
- Tool-call parts render: agar `generate_image` tool ka image return ho to inline `<img>` with download + "Open in studio" link.
- AI Elements `Message` actions / custom buttons (lucide icons: Copy, RefreshCw, Pencil, Trash2).

## 5. Code side drawer
- Custom `CodeBlock` component for `react-markdown` `code` renderer:
  - Inline: language badge + small Copy button (top-right).
  - "Expand" button → opens shadcn `Sheet` (right side, wide) with full code, syntax highlighting (`react-syntax-highlighter` ya simple `<pre>`), Copy + Download buttons.
- Drawer state lift to chat page; sirf ek drawer ek time pe.

## 6. Files to create/edit
- create: `src/lib/openai.server.ts`, `src/components/chat/MessageActions.tsx`, `src/components/chat/CodeBlock.tsx`, `src/components/chat/CodeDrawer.tsx`, `src/lib/tools/generate-image.server.ts`.
- edit: `src/lib/ai-gateway.server.ts`, `src/routes/api/chat.ts`, `src/routes/api/generate-image.ts`, `src/routes/chat.$threadId.tsx`, `src/lib/threads.ts` (helper for message edit/delete persistence).
- install: `bun add react-syntax-highlighter @types/react-syntax-highlighter` (drawer ke liye), shadcn `sheet` already present hoga — verify.

## 7. Verify
- `curl /api/chat` with sample messages → streams.
- `/image cat` chat me → tool call → inline image.
- Code response → inline copy works, Expand opens drawer.
- Edit/regenerate/delete persist in localStorage thread store.

## Notes
- Voice button untouched.
- Lovable Gateway code remove nahi karunga abhi — sirf provider switch; agar future me wapas chahiye to easy revert.
