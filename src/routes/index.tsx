import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Feather, Lightbulb, Code2, ImageIcon, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { threadStore, emitThreadsChanged, type ThreadMode } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — AI Content Studio" },
      {
        name: "description",
        content:
          "An editorial AI workspace for drafting, brainstorming, coding, and image generation.",
      },
    ],
  }),
  component: Home,
});

const TILES: Array<{
  mode: ThreadMode;
  title: string;
  desc: string;
  icon: typeof Feather;
  accent: string;
}> = [
  {
    mode: "writer",
    title: "Writer",
    desc: "Draft essays, copy, scripts, and emails with an editorial partner.",
    icon: Feather,
    accent: "from-ember/15 to-transparent",
  },
  {
    mode: "brainstorm",
    title: "Brainstorm",
    desc: "Generate divergent angles, names, and ideas — fast.",
    icon: Lightbulb,
    accent: "from-amber-400/15 to-transparent",
  },
  {
    mode: "code",
    title: "Code",
    desc: "Production-quality snippets with concise explanations.",
    icon: Code2,
    accent: "from-cyan-500/15 to-transparent",
  },
];

const ease = [0.2, 0.7, 0.2, 1] as const;

function Home() {
  const navigate = useNavigate();
  const start = (mode: ThreadMode) => {
    const t = threadStore.create(mode);
    emitThreadsChanged();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  return (
    <div className="grain relative flex-1 overflow-hidden">
      <div className="aurora" aria-hidden />

      <section className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 pt-16 pb-16 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
          </span>
          A quiet AI studio for craft work
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="text-display text-5xl leading-[0.95] font-semibold md:text-7xl"
        >
          Write, think, and make —<br />
          <span className="italic shimmer-text">in one workspace.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.15 }}
          className="max-w-2xl text-lg text-muted-foreground"
        >
          Atelier pairs an editorial writing partner, an idea engine, a coding
          collaborator, and an image studio. Conversations stay on your
          machine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.22 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            size="lg"
            onClick={() => start("writer")}
            className="group relative overflow-hidden"
          >
            <span className="relative z-10 inline-flex items-center">
              Start writing
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/images" })}
            className="hover-lift"
          >
            <ImageIcon className="mr-1 h-4 w-4" /> Open image studio
          </Button>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {TILES.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.3 + i * 0.08 }}
              whileHover={{ y: -4 }}
              onClick={() => start(t.mode)}
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-ember hover-lift"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-secondary text-ember transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="h-5 w-5" />
              </div>
              <div className="relative text-display text-2xl font-semibold">{t.title}</div>
              <p className="relative text-sm text-muted-foreground">{t.desc}</p>
              <span className="relative mt-auto inline-flex items-center text-sm font-medium text-ember">
                Begin
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-ink to-ink/90 p-10 text-cream md:p-14"
        >
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-ember/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs text-cream/70">
              <Sparkles className="h-3.5 w-3.5" /> Image Studio
            </div>
            <h2 className="text-display text-4xl font-semibold md:text-5xl">
              Type a sentence.<br />
              <span className="italic text-ember">Get an image.</span>
            </h2>
            <p className="mt-4 text-cream/70">
              Generate editorial-grade visuals from a single prompt. Save the
              ones you love to your local gallery.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 bg-cream text-ink hover:bg-cream/90"
              onClick={() => navigate({ to: "/images" })}
            >
              Try the image studio <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
