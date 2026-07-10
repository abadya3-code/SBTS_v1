import { Link, useRoute } from "wouter";
import { AlertTriangle, CheckCircle2, Clock3, FileWarning, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-extrabold text-slate-950 dark:text-white">{value ?? "-"}</div>
    </div>
  );
}

export default function FieldVerification() {
  const [, params] = useRoute("/qr/blind/:token");
  const token = params?.token ?? "";
  const verificationQuery = trpc.fieldCompliance.verifyQrToken.useQuery({ token }, { enabled: token.length > 0, refetchOnWindowFocus: false });
  const result = verificationQuery.data as any;
  const compliance = result?.compliance;
  const blind = compliance?.blind;
  const tokenRow = result?.token;
  const success = result?.status === "success";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 industrial-grid dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                <QrCode className="h-4 w-4" /> Field QR Verification
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight">SBTS Field Verification</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                Read-only mobile verification for blind identity, phase, PTW / LOTO, risk, evidence, and inspection readiness.
              </p>
            </div>
            {success ? <CheckCircle2 className="h-10 w-10 text-emerald-300" /> : <AlertTriangle className="h-10 w-10 text-amber-300" />}
          </div>
        </div>

        {verificationQuery.isLoading && (
          <Card><CardContent className="p-8 text-center text-sm font-bold text-slate-500">Verifying QR token...</CardContent></Card>
        )}

        {!verificationQuery.isLoading && !success && (
          <Card className="border-red-100 bg-white shadow-sm dark:border-red-900/50 dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="mt-1 h-6 w-6 text-red-600" />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">QR verification failed</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{result?.message ?? "The QR token is invalid or unavailable."}</p>
                  <Button asChild className="mt-5 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"><Link href="/login">Open SBTS login</Link></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {success && blind && (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Detail label="Blind tag" value={blind.tag} />
              <Detail label="Project" value={blind.projectId} />
              <Detail label="Phase" value={blind.phase} />
              <Detail label="Priority" value={blind.priority} />
              <Detail label="Type" value={blind.type} />
              <Detail label="Size" value={blind.size} />
              <Detail label="Equipment / line" value={blind.equipment} />
              <Detail label="Isolation point" value={blind.isolationPoint} />
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base font-extrabold"><ShieldCheck className="h-5 w-5" /> Compliance status</CardTitle></CardHeader>
                <CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-2">
                  <Detail label="Evidence" value={compliance.counts?.evidence ?? 0} />
                  <Detail label="Checklists complete" value={compliance.counts?.completedChecklists ?? 0} />
                  <Detail label="Torque records" value={compliance.counts?.torqueRecords ?? 0} />
                  <Detail label="Inspection records" value={compliance.counts?.inspectionRecords ?? 0} />
                  <Detail label="Risk assessments" value={compliance.counts?.riskAssessments ?? 0} />
                  <Detail label="PTW / LOTO active" value={compliance.counts?.activePtwLoto ?? 0} />
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base font-extrabold"><LockKeyhole className="h-5 w-5" /> Latest PTW / LOTO & risk</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-5 pt-0">
                  {(compliance.ptwLotoRecords ?? []).slice(0, 2).map((row: any) => (
                    <div key={row.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                      <div className="flex justify-between gap-3"><div className="font-extrabold">{row.ptwNumber || "No PTW"}</div><Badge variant="outline">{row.permitStatus}</Badge></div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">LOTO: {row.lotoNumber || "-"} · Isolation: {row.isolationStatus}</div>
                    </div>
                  ))}
                  {(compliance.riskAssessments ?? []).slice(0, 2).map((row: any) => (
                    <div key={row.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                      <div className="flex justify-between gap-3"><div className="font-extrabold">Risk: {row.riskLevel}</div><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Residual: {row.residualRisk}</Badge></div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">Status: {row.status} · Assessor: {row.assessorName || "-"}</div>
                    </div>
                  ))}
                  {(!compliance.ptwLotoRecords?.length && !compliance.riskAssessments?.length) && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-800">No PTW/LOTO or risk records have been added yet.</div>}
                </CardContent>
              </Card>
            </section>

            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300"><Clock3 className="h-5 w-5" /> Token scans: {tokenRow?.scanCount ?? 0} · Last scan will update after refresh.</div>
                <Button asChild variant="outline" className="rounded-2xl bg-white"><Link href="/login"><FileWarning className="h-4 w-4" /> Open full SBTS</Link></Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
