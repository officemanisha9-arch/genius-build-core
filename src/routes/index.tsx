import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Feather, Lightbulb, Code2, ImageIcon, ArrowRight } from "lucide-react";
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
}> = [
  {
    mode: "writer",
    title: "Writer",
    desc: "Draft essays, copy, scripts, and emails with an editorial partner.",
    icon: Feather,
  },
  {
    mode: "brainstorm",
    title: "Brainstorm",
    desc: "Generate divergent angles, names, and ideas — fast.",
    icon: Lightbulb,
  },
  {
    mode: "code",
    title: "Code",
    desc: "Production-quality snippets with concise explanations.",
    icon: Code2,
  },
];

function Home() {
  const navigate = useNavigate();
  const start = (mode: ThreadMode) => {
    const t = threadStore.create(mode);
    emitThreadsChanged();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  return (
    <div className="grain relative flex-1">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 pt-16 pb-12 md:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-ember" />
          A quiet AI studio for craft work
        </div>
        <h1 className="text-display text-5xl leading-[0.95] font-semibold md:text-7xl">
          Write, think, and make —<br />
          <span className="italic text-ember">in one workspace.</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Atelier pairs an editorial writing partner, an idea engine, a coding
          collaborator, and an image studio. Conversations stay on your
          machine.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => start("writer")}>
            Start writing <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/images" })}>
            <ImageIcon className="mr-1 h-4 w-4" /> Open image studio
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.mode}
              onClick={() => start(t.mode)}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-ember hover:shadow-lg"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-ember">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-display text-2xl font-semibold">{t.title}</div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <span className="mt-auto inline-flex items-center text-sm font-medium text-ember">
                Begin <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
