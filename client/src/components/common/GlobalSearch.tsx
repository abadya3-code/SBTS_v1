import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  FileWarning,
  FolderKanban,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type SearchResult = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  type: "Project" | "Blind";
};

export function GlobalSearch({ className = "" }: { className?: string }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const trimmed = query.trim();

  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });

  const blindsQuery = trpc.slipBlinds.list.useQuery(
    { search: trimmed, limit: 8, offset: 0 },
    {
      enabled: trimmed.length >= 2,
      staleTime: 20_000,
    }
  );

  const results = useMemo<SearchResult[]>(() => {
    if (trimmed.length < 2) return [];
    const needle = trimmed.toLowerCase();
    const projectRows = (projectsQuery.data ?? [])
      .filter((project: any) =>
        [project.id, project.name, project.areaCode, project.areaName].some(
          value =>
            String(value ?? "")
              .toLowerCase()
              .includes(needle)
        )
      )
      .slice(0, 6)
      .map((project: any) => ({
        key: `project-${project.id}`,
        title: project.name,
        subtitle: `${project.id} · ${project.areaCode ?? "Area"} · ${project.status ?? "Active"}`,
        href: `/projects/${project.id}`,
        type: "Project" as const,
      }));

    const blindRows = ((blindsQuery.data as any)?.rows ?? [])
      .slice(0, 8)
      .map((blind: any) => ({
        key: `blind-${blind.projectId}-${blind.tag}`,
        title: blind.tag,
        subtitle: `${blind.projectName ?? blind.projectId} · ${blind.type ?? "Blind"} · ${blind.phase ?? blind.slipStatus ?? "Status"}`,
        href: `/projects/${blind.projectId}/blinds/${encodeURIComponent(blind.tag)}`,
        type: "Blind" as const,
      }));

    return [...blindRows, ...projectRows].slice(0, 10);
  }, [trimmed, projectsQuery.data, blindsQuery.data]);

  const isLoading = projectsQuery.isFetching || blindsQuery.isFetching;
  const open = focused && trimmed.length >= 2;

  const goTo = (href: string) => {
    setLocation(href);
    setFocused(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm ring-1 ring-transparent transition focus-within:border-cyan-300 focus-within:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search tag, project, area..."
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
        )}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close search"
            onClick={() => setFocused(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Global Search
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Type at least 2 characters. Search reads projects and the blind
                registry.
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {results.length === 0 && !isLoading ? (
                <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                  No matching projects or blinds found.
                </div>
              ) : (
                results.map(result => {
                  const Icon =
                    result.type === "Blind" ? FileWarning : FolderKanban;
                  return (
                    <button
                      key={result.key}
                      type="button"
                      onClick={() => goTo(result.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cyan-50 dark:hover:bg-slate-800"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {result.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                          {result.subtitle}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-slate-500 dark:bg-slate-800">
                        {result.type}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
