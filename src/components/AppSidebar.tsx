import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Feather, Lightbulb, Code2, ImageIcon, Plus, Trash2, Sparkle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  emitThreadsChanged,
  subscribeThreads,
  threadStore,
  type Thread,
  type ThreadMode,
} from "@/lib/threads";
import { cn } from "@/lib/utils";

const MODE_META: Record<ThreadMode, { label: string; icon: typeof Feather }> = {
  writer: { label: "Writer", icon: Feather },
  brainstorm: { label: "Brainstorm", icon: Lightbulb },
  code: { label: "Code", icon: Code2 },
};

export function AppSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    const refresh = () => setThreads(threadStore.list());
    refresh();
    return subscribeThreads(refresh);
  }, []);

  const createThread = (mode: ThreadMode) => {
    const t = threadStore.create(mode);
    emitThreadsChanged();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const removeThread = (id: string) => {
    threadStore.remove(id);
    emitThreadsChanged();
    if (pathname.includes(id)) navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-ink text-cream">
            <Sparkle className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-display text-lg font-semibold">Atelier</div>
            <div className="text-xs text-muted-foreground">Content Studio</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>New conversation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(Object.keys(MODE_META) as ThreadMode[]).map((mode) => {
                const M = MODE_META[mode];
                const Icon = M.icon;
                return (
                  <SidebarMenuItem key={mode}>
                    <SidebarMenuButton onClick={() => createThread(mode)}>
                      <Icon className="h-4 w-4" />
                      <span>{M.label}</span>
                      <Plus className="ml-auto h-3.5 w-3.5 opacity-60" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/images"}>
                  <Link to="/images">
                    <ImageIcon className="h-4 w-4" />
                    <span>Image Studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No conversations yet.
                </div>
              )}
              {threads.map((t) => {
                const Icon = MODE_META[t.mode].icon;
                const active = pathname === `/chat/${t.id}`;
                return (
                  <SidebarMenuItem key={t.id}>
                    <div
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent",
                        active && "bg-sidebar-accent",
                      )}
                    >
                      <Link
                        to="/chat/$threadId"
                        params={{ threadId: t.id }}
                        className="flex min-w-0 flex-1 items-center gap-2"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-ember" />
                        <span className="truncate">{t.title || "New conversation"}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeThread(t.id);
                        }}
                        className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-xs text-muted-foreground">
          Saved locally in your browser.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
