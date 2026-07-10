import { ArrowUpRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type BlindPhase = "Broken / Preparation" | "Assembly" | "Tight & Torque" | "Final Tight" | "Inspection Ready";

interface PhaseOwner {
  openId: string;
  name: string;
  avatarUrl?: string | null;
  email?: string | null;
}

interface PhaseData {
  phase: BlindPhase;
  color: string;
  count: number;
  progress: number;
  owners: PhaseOwner[];
}

interface WorkflowPhasesProps {
  phases: PhaseData[];
  onPhaseClick?: (phase: BlindPhase) => void;
}

const phaseColorMap: Record<BlindPhase, { shell: string; dot: string }> = {
  "Broken / Preparation": { shell: "border-amber-200 bg-amber-50/80 text-amber-950", dot: "bg-amber-500" },
  Assembly: { shell: "border-blue-200 bg-blue-50/80 text-blue-950", dot: "bg-blue-500" },
  "Tight & Torque": { shell: "border-purple-200 bg-purple-50/80 text-purple-950", dot: "bg-purple-500" },
  "Final Tight": { shell: "border-emerald-200 bg-emerald-50/80 text-emerald-950", dot: "bg-emerald-500" },
  "Inspection Ready": { shell: "border-teal-200 bg-teal-50/80 text-teal-950", dot: "bg-teal-500" },
};

export function WorkflowPhases({ phases, onPhaseClick }: WorkflowPhasesProps) {
  const totalBlinds = phases.reduce((sum, item) => sum + item.count, 0);
  const staffedPhases = phases.filter(item => item.owners.length > 0).length;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-slate-950">
              <Users className="h-5 w-5 text-slate-600" />
              Workflow Phases & Ownership
            </CardTitle>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Compact execution view showing phase workload, progress, and the assigned owners.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Phases</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{phases.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Assigned</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{staffedPhases}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 sm:col-span-1 col-span-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tracked blinds</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{totalBlinds}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-4 xl:grid-cols-2">
          {phases.map(phaseData => {
            const colors = phaseColorMap[phaseData.phase];
            return (
              <button
                type="button"
                key={phaseData.phase}
                onClick={() => onPhaseClick?.(phaseData.phase)}
                className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${colors.shell}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                      <h3 className="text-base font-extrabold">{phaseData.phase}</h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {phaseData.owners.length > 0 ? `${phaseData.owners.length} assigned owner${phaseData.owners.length > 1 ? "s" : ""}` : "No owner assigned yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200">
                      {phaseData.count} blinds
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Progress</span>
                    <span>{phaseData.progress}%</span>
                  </div>
                  <Progress value={phaseData.progress} className="h-2.5 bg-white/70" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {phaseData.owners.length === 0 ? (
                    <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                      No assigned owner
                    </span>
                  ) : (
                    phaseData.owners.map(owner => (
                      <div key={owner.openId} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2 py-1.5 ring-1 ring-slate-200">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={owner.avatarUrl ?? undefined} alt={owner.name} />
                          <AvatarFallback className="text-[10px] font-extrabold">{owner.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="max-w-[11rem] truncate text-xs font-bold text-slate-800">{owner.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
