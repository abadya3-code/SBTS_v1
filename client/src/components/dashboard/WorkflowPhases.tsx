import { ChevronRight, Users } from "lucide-react";
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

const phaseColorMap: Record<BlindPhase, string> = {
  "Broken / Preparation": "bg-amber-50 border-amber-200 text-amber-900",
  Assembly: "bg-blue-50 border-blue-200 text-blue-900",
  "Tight & Torque": "bg-purple-50 border-purple-200 text-purple-900",
  "Final Tight": "bg-green-50 border-green-200 text-green-900",
  "Inspection Ready": "bg-emerald-50 border-emerald-200 text-emerald-900",
};

const phaseProgressColors: Record<BlindPhase, string> = {
  "Broken / Preparation": "bg-amber-500",
  Assembly: "bg-blue-500",
  "Tight & Torque": "bg-purple-500",
  "Final Tight": "bg-green-500",
  "Inspection Ready": "bg-emerald-500",
};

export function WorkflowPhases({ phases, onPhaseClick }: WorkflowPhasesProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Users className="h-5 w-5 text-slate-600" />
          Workflow Phases & Ownership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.map((phaseData) => (
          <div
            key={phaseData.phase}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${phaseColorMap[phaseData.phase]}`}
            onClick={() => onPhaseClick?.(phaseData.phase)}
          >
            {/* Phase Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{phaseData.phase}</h3>
                <span className="inline-flex items-center rounded-full bg-white/50 px-2.5 py-0.5 text-xs font-bold ring-1 ring-current/20">
                  {phaseData.count}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </div>

            {/* Progress Bar */}
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-75">Progress</span>
                <span className="text-xs font-bold opacity-75">{phaseData.progress}%</span>
              </div>
              <Progress value={phaseData.progress} className="h-2" />
            </div>

            {/* Phase Owners */}
            {phaseData.owners.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium opacity-75">Owners:</span>
                <div className="flex -space-x-2">
                  {phaseData.owners.map((owner) => (
                    <Avatar
                      key={owner.openId}
                      className="h-6 w-6 border-2 border-white/50"
                      title={owner.name}
                    >
                      <AvatarImage src={owner.avatarUrl ?? undefined} alt={owner.name} />
                      <AvatarFallback className="text-xs font-bold">
                        {owner.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
