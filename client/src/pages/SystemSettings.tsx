/*
Design Philosophy: Industrial Command Center Minimalism.
System Settings Center — Full operational configuration in one authoritative panel.
5 Tabs: General, Default Tag, Certificate, Security, Notifications.
*/
import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Building2, FileText, Lock, Save, Settings, Shield, Tag, Upload, X, Image, Palette, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";

type Tab = "general" | "defaultTag" | "certificate" | "security" | "notifications";

const tabs: { key: Tab; label: string; icon: typeof Settings; description: string }[] = [
  { key: "general", label: "General Settings", icon: Settings, description: "App identity, company info, dashboard & versioning" },
  { key: "defaultTag", label: "Default Tag Settings", icon: Tag, description: "Tag format, visuals & live preview" },
  { key: "certificate", label: "Certificate Settings", icon: FileText, description: "Print layout, sections & branding" },
  { key: "security", label: "Security Settings", icon: Shield, description: "QR access, delete policies & sessions" },
  { key: "notifications", label: "Notification Settings", icon: Bell, description: "Event notification preferences" },
];

// ─── General Settings Tab ─────────────────────────────────────────────────────

function GeneralSettingsTab() {
  const { data, isLoading, refetch } = trpc.settings.general.get.useQuery();
  const updateMutation = trpc.settings.general.update.useMutation({
    onSuccess: () => { toast.success("General settings saved successfully."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadImageMutation = trpc.settings.general.uploadImage.useMutation({
    onSuccess: ({ url }) => { toast.success("Image uploaded."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<{
    companyName: string; companyCode: string; plantName: string; contractNumber: string;
    language: "en" | "ar"; timezone: string; dateFormat: string;
    appName: string; appDescription: string; appImageUrl: string; companyLogoUrl: string;
    companyDescription: string; regionName: string;
    dashboardHeroTitle: string; dashboardHeroDescription: string; dashboardHeroBadge: string;
    dashboardHeroImageUrl: string; dashboardCtaButtons: string;
    versionName: string; versionDate: string;
    maintenanceMode: boolean;
  } | null>(null);

  if (data && !form) {
    setForm({
      companyName: data.companyName,
      companyCode: data.companyCode,
      plantName: data.plantName,
      contractNumber: data.contractNumber ?? "",
      language: (data.language as "en" | "ar") ?? "en",
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      appName: data.appName ?? "SBTS Professional",
      appDescription: data.appDescription ?? "",
      appImageUrl: data.appImageUrl ?? "",
      companyLogoUrl: data.companyLogoUrl ?? "",
      companyDescription: data.companyDescription ?? "",
      regionName: data.regionName ?? "",
      dashboardHeroTitle: data.dashboardHeroTitle ?? "",
      dashboardHeroDescription: data.dashboardHeroDescription ?? "",
      dashboardHeroBadge: data.dashboardHeroBadge ?? "",
      dashboardHeroImageUrl: data.dashboardHeroImageUrl ?? "",
      dashboardCtaButtons: data.dashboardCtaButtons ?? "[]",
      versionName: data.versionName ?? "",
      versionDate: data.versionDate ?? "",
      maintenanceMode: data.maintenanceMode === 1,
    });
  }

  if (isLoading || !form) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  const handleUpload = (target: "appImage" | "companyLogo" | "heroImage") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/svg+xml,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast.error("File must be under 2MB"); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        uploadImageMutation.mutate({ base64, mimeType: file.type as "image/png", target });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSave = () => {
    updateMutation.mutate({
      companyName: form.companyName,
      companyCode: form.companyCode,
      plantName: form.plantName,
      contractNumber: form.contractNumber || null,
      language: form.language,
      timezone: form.timezone,
      dateFormat: form.dateFormat,
      appName: form.appName,
      appDescription: form.appDescription || null,
      appImageUrl: form.appImageUrl || null,
      companyLogoUrl: form.companyLogoUrl || null,
      companyDescription: form.companyDescription || null,
      regionName: form.regionName,
      dashboardHeroTitle: form.dashboardHeroTitle,
      dashboardHeroDescription: form.dashboardHeroDescription || null,
      dashboardHeroBadge: form.dashboardHeroBadge,
      dashboardHeroImageUrl: form.dashboardHeroImageUrl || null,
      dashboardCtaButtons: form.dashboardCtaButtons || null,
      versionName: form.versionName,
      versionDate: form.versionDate || null,
      maintenanceMode: form.maintenanceMode,
    });
  };

  return (
    <div className="space-y-6">
      {/* App Identity */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 ring-1 ring-cyan-100">
              <Image className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-slate-950">Application Identity</CardTitle>
              <CardDescription className="text-xs text-slate-500">App name, description, and default image</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Application Name</Label>
              <Input value={form.appName} onChange={e => setForm(f => f && ({ ...f, appName: e.target.value }))} placeholder="SBTS Professional" className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Region / Location</Label>
              <Input value={form.regionName} onChange={e => setForm(f => f && ({ ...f, regionName: e.target.value }))} placeholder="e.g. Eastern Province" className="sbts-input" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Application Description</Label>
              <Textarea value={form.appDescription} onChange={e => setForm(f => f && ({ ...f, appDescription: e.target.value }))} placeholder="Brief description of the application..." rows={2} className="sbts-input resize-none" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">App Image</Label>
              <div className="flex items-center gap-3">
                {form.appImageUrl && <img src={form.appImageUrl} alt="App" className="h-14 w-14 rounded-xl border object-cover" />}
                <Button type="button" variant="outline" size="sm" onClick={() => handleUpload("appImage")} disabled={uploadImageMutation.isPending}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> {form.appImageUrl ? "Replace" : "Upload"}
                </Button>
                {form.appImageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => f && ({ ...f, appImageUrl: "" }))} className="text-red-500"><X className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Logo</Label>
              <div className="flex items-center gap-3">
                {form.companyLogoUrl && <img src={form.companyLogoUrl} alt="Logo" className="h-14 w-14 rounded-xl border object-contain" />}
                <Button type="button" variant="outline" size="sm" onClick={() => handleUpload("companyLogo")} disabled={uploadImageMutation.isPending}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> {form.companyLogoUrl ? "Replace" : "Upload"}
                </Button>
                {form.companyLogoUrl && <Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => f && ({ ...f, companyLogoUrl: "" }))} className="text-red-500"><X className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 ring-1 ring-cyan-100">
              <Building2 className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-slate-950">Company Information</CardTitle>
              <CardDescription className="text-xs text-slate-500">Core organizational identifiers used across reports and certificates</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Name</Label>
              <Input value={form.companyName} onChange={e => setForm(f => f && ({ ...f, companyName: e.target.value }))} placeholder="e.g. Shedgum Gas Plant" className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Code</Label>
              <Input value={form.companyCode} onChange={e => setForm(f => f && ({ ...f, companyCode: e.target.value }))} placeholder="e.g. SGP" maxLength={10} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Plant Name</Label>
              <Input value={form.plantName} onChange={e => setForm(f => f && ({ ...f, plantName: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Contract Number</Label>
              <Input value={form.contractNumber} onChange={e => setForm(f => f && ({ ...f, contractNumber: e.target.value }))} placeholder="SAP-2024-001" className="sbts-input" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Description</Label>
              <Textarea value={form.companyDescription} onChange={e => setForm(f => f && ({ ...f, companyDescription: e.target.value }))} rows={2} className="sbts-input resize-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Localization</CardTitle>
          <CardDescription className="text-xs text-slate-500">Language, timezone, and date format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Language</Label>
              <Select value={form.language} onValueChange={v => setForm(f => f && ({ ...f, language: v as "en" | "ar" }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Timezone</Label>
              <Select value={form.timezone} onValueChange={v => setForm(f => f && ({ ...f, timezone: v }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Date Format</Label>
              <Select value={form.dateFormat} onValueChange={v => setForm(f => f && ({ ...f, dateFormat: v }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Hero */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Dashboard Hero Section</CardTitle>
          <CardDescription className="text-xs text-slate-500">Title, description, badge, and CTA buttons shown on the main dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Hero Title</Label>
              <Input value={form.dashboardHeroTitle} onChange={e => setForm(f => f && ({ ...f, dashboardHeroTitle: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Hero Description</Label>
              <Textarea value={form.dashboardHeroDescription} onChange={e => setForm(f => f && ({ ...f, dashboardHeroDescription: e.target.value }))} rows={2} className="sbts-input resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Badge Text</Label>
              <Input value={form.dashboardHeroBadge} onChange={e => setForm(f => f && ({ ...f, dashboardHeroBadge: e.target.value }))} placeholder="e.g. Production Ready" className="sbts-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Hero Background Image</Label>
              <div className="flex items-center gap-3">
                {form.dashboardHeroImageUrl && <img src={form.dashboardHeroImageUrl} alt="Hero" className="h-10 w-20 rounded-lg border object-cover" />}
                <Button type="button" variant="outline" size="sm" onClick={() => handleUpload("heroImage")} disabled={uploadImageMutation.isPending}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> {form.dashboardHeroImageUrl ? "Replace" : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version & System */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Version & System</CardTitle>
          <CardDescription className="text-xs text-slate-500">Version info and maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Version Name</Label>
              <Input value={form.versionName} onChange={e => setForm(f => f && ({ ...f, versionName: e.target.value }))} placeholder="Professional Edition v1.0" className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Version Date</Label>
              <Input value={form.versionDate} onChange={e => setForm(f => f && ({ ...f, versionDate: e.target.value }))} placeholder="2025-01-01" className="sbts-input" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-amber-900">Maintenance Mode</div>
                {form.maintenanceMode && <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 text-[10px]">ACTIVE</Badge>}
              </div>
              <div className="text-xs text-amber-700">Restrict system access to administrators only</div>
            </div>
            <Switch checked={form.maintenanceMode} onCheckedChange={v => setForm(f => f && ({ ...f, maintenanceMode: v }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-2xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save General Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Default Tag Settings Tab ─────────────────────────────────────────────────

function DefaultTagSettingsTab() {
  const { data, isLoading, refetch } = trpc.settings.defaultTag.get.useQuery();
  const updateMutation = trpc.settings.defaultTag.update.useMutation({
    onSuccess: () => { toast.success("Tag settings saved."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<{
    tagPrefix: string; tagSeparator: string; tagPaddingDigits: number; tagStartNumber: number;
    defaultType: string; defaultSize: string; defaultRate: string;
    defaultPriority: "Low" | "Normal" | "High" | "Critical";
    defaultPhase: "Broken / Preparation" | "Assembly" | "Tight & Torque" | "Final Tight" | "Inspection Ready";
    autoGenerateTag: boolean; requireEquipment: boolean; requireLocation: boolean; requireIsolationPoint: boolean;
    tagColor: string; tagWidth: number; tagHeight: number; tagFontSize: number; tagFontColor: string;
    tagTheme: string; tagShowLogo: boolean; tagShowQR: boolean; tagHoleEnabled: boolean; tagHolePosition: string;
  } | null>(null);

  if (data && !form) {
    setForm({
      tagPrefix: data.tagPrefix,
      tagSeparator: data.tagSeparator,
      tagPaddingDigits: data.tagPaddingDigits,
      tagStartNumber: data.tagStartNumber,
      defaultType: data.defaultType,
      defaultSize: data.defaultSize,
      defaultRate: data.defaultRate ?? "",
      defaultPriority: (data.defaultPriority as "Low" | "Normal" | "High" | "Critical") ?? "Normal",
      defaultPhase: (data.defaultPhase as "Broken / Preparation" | "Assembly" | "Tight & Torque" | "Final Tight" | "Inspection Ready") ?? "Broken / Preparation",
      autoGenerateTag: data.autoGenerateTag === 1,
      requireEquipment: data.requireEquipment === 1,
      requireLocation: data.requireLocation === 1,
      requireIsolationPoint: data.requireIsolationPoint === 1,
      tagColor: (data as any).tagColor ?? "#0f172a",
      tagWidth: (data as any).tagWidth ?? 85,
      tagHeight: (data as any).tagHeight ?? 55,
      tagFontSize: (data as any).tagFontSize ?? 14,
      tagFontColor: (data as any).tagFontColor ?? "#0f172a",
      tagTheme: (data as any).tagTheme ?? "industrial",
      tagShowLogo: ((data as any).tagShowLogo ?? 1) === 1,
      tagShowQR: ((data as any).tagShowQR ?? 1) === 1,
      tagHoleEnabled: ((data as any).tagHoleEnabled ?? 1) === 1,
      tagHolePosition: (data as any).tagHolePosition ?? "top-center",
    });
  }

  if (isLoading || !form) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  const previewTag = `${form.tagPrefix}${form.tagSeparator}${String(form.tagStartNumber).padStart(form.tagPaddingDigits, "0")}`;

  const handleSave = () => {
    updateMutation.mutate({
      tagPrefix: form.tagPrefix,
      tagSeparator: form.tagSeparator,
      tagPaddingDigits: form.tagPaddingDigits,
      tagStartNumber: form.tagStartNumber,
      defaultType: form.defaultType,
      defaultSize: form.defaultSize,
      defaultRate: form.defaultRate || undefined,
      defaultPriority: form.defaultPriority,
      defaultPhase: form.defaultPhase,
      autoGenerateTag: form.autoGenerateTag,
      requireEquipment: form.requireEquipment,
      requireLocation: form.requireLocation,
      requireIsolationPoint: form.requireIsolationPoint,
      tagColor: form.tagColor,
      tagWidth: form.tagWidth,
      tagHeight: form.tagHeight,
      tagFontSize: form.tagFontSize,
      tagFontColor: form.tagFontColor,
      tagTheme: form.tagTheme,
      tagShowLogo: form.tagShowLogo,
      tagShowQR: form.tagShowQR,
      tagHoleEnabled: form.tagHoleEnabled,
      tagHolePosition: form.tagHolePosition,
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Tag Preview */}
      <Card className="sbts-card border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold text-slate-950">Live Tag Preview</CardTitle>
          <CardDescription className="text-xs text-slate-500">Changes reflect in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div
              className="relative rounded-2xl border-2 shadow-lg flex flex-col items-center justify-between p-4"
              style={{
                width: `${form.tagWidth}mm`,
                height: `${form.tagHeight}mm`,
                borderColor: form.tagColor,
                minWidth: "200px",
                minHeight: "140px",
                maxWidth: "340px",
              }}
            >
              {form.tagHoleEnabled && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-slate-400 bg-white" />
              )}
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] mt-3" style={{ color: form.tagColor }}>
                SBTS BLIND TAG
              </div>
              <div className="font-mono text-2xl font-extrabold tracking-wide" style={{ color: form.tagFontColor, fontSize: `${form.tagFontSize}px` }}>
                {previewTag}
              </div>
              {form.tagShowQR && (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                  <span className="text-[9px] font-bold text-slate-400">QR</span>
                </div>
              )}
              {form.tagShowLogo && (
                <div className="text-[8px] font-bold text-slate-400 mt-1">LOGO</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tag Format */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-950">Tag Format</CardTitle>
              <CardDescription className="text-xs text-slate-500">Configure how blind tags are auto-generated</CardDescription>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">Preview</div>
              <div className="font-mono text-lg font-extrabold text-cyan-800">{previewTag}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Prefix</Label>
              <Input value={form.tagPrefix} onChange={e => setForm(f => f && ({ ...f, tagPrefix: e.target.value }))} maxLength={10} className="sbts-input font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Separator</Label>
              <Input value={form.tagSeparator} onChange={e => setForm(f => f && ({ ...f, tagSeparator: e.target.value }))} maxLength={3} className="sbts-input font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Padding Digits</Label>
              <Input type="number" min={1} max={6} value={form.tagPaddingDigits} onChange={e => setForm(f => f && ({ ...f, tagPaddingDigits: parseInt(e.target.value) || 3 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Start Number</Label>
              <Input type="number" min={1} value={form.tagStartNumber} onChange={e => setForm(f => f && ({ ...f, tagStartNumber: parseInt(e.target.value) || 1 }))} className="sbts-input" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Auto-Generate Tag</div>
              <div className="text-xs text-slate-500">Automatically generate tag number when adding new blinds</div>
            </div>
            <Switch checked={form.autoGenerateTag} onCheckedChange={v => setForm(f => f && ({ ...f, autoGenerateTag: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Tag Visual Settings */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-cyan-700" />
            <div>
              <CardTitle className="text-base font-extrabold text-slate-950">Tag Visual Settings</CardTitle>
              <CardDescription className="text-xs text-slate-500">Colors, dimensions, and display options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Border Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.tagColor} onChange={e => setForm(f => f && ({ ...f, tagColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border" />
                <Input value={form.tagColor} onChange={e => setForm(f => f && ({ ...f, tagColor: e.target.value }))} className="sbts-input font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Font Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.tagFontColor} onChange={e => setForm(f => f && ({ ...f, tagFontColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border" />
                <Input value={form.tagFontColor} onChange={e => setForm(f => f && ({ ...f, tagFontColor: e.target.value }))} className="sbts-input font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Font Size (px)</Label>
              <Input type="number" min={8} max={32} value={form.tagFontSize} onChange={e => setForm(f => f && ({ ...f, tagFontSize: parseInt(e.target.value) || 14 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Width (mm)</Label>
              <Input type="number" min={40} max={200} value={form.tagWidth} onChange={e => setForm(f => f && ({ ...f, tagWidth: parseInt(e.target.value) || 85 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Height (mm)</Label>
              <Input type="number" min={30} max={150} value={form.tagHeight} onChange={e => setForm(f => f && ({ ...f, tagHeight: parseInt(e.target.value) || 55 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Theme</Label>
              <Select value={form.tagTheme} onValueChange={v => setForm(f => f && ({ ...f, tagTheme: v }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            {[
              { key: "tagShowLogo" as const, label: "Show Logo on Tag", desc: "Display company logo on the physical tag" },
              { key: "tagShowQR" as const, label: "Show QR Code", desc: "Include scannable QR code on the tag" },
              { key: "tagHoleEnabled" as const, label: "Hanging Hole", desc: "Add a hole marker for physical tag attachment" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
              </div>
            ))}
            {form.tagHoleEnabled && (
              <div className="ml-4 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Hole Position</Label>
                <Select value={form.tagHolePosition} onValueChange={v => setForm(f => f && ({ ...f, tagHolePosition: v }))}>
                  <SelectTrigger className="sbts-input w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-center">Top Center</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default Blind Values */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Default Blind Values</CardTitle>
          <CardDescription className="text-xs text-slate-500">Pre-filled values when registering new blinds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Default Type</Label>
              <Select value={form.defaultType} onValueChange={v => setForm(f => f && ({ ...f, defaultType: v }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spectacle Blind">Spectacle Blind</SelectItem>
                  <SelectItem value="Slip Blind">Slip Blind</SelectItem>
                  <SelectItem value="Drop Spool">Drop Spool</SelectItem>
                  <SelectItem value="Isolation">Isolation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Default Size</Label>
              <Input value={form.defaultSize} onChange={e => setForm(f => f && ({ ...f, defaultSize: e.target.value }))} placeholder='e.g. 2"' className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Default Rate</Label>
              <Input value={form.defaultRate} onChange={e => setForm(f => f && ({ ...f, defaultRate: e.target.value }))} placeholder="e.g. 150#" className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Default Priority</Label>
              <Select value={form.defaultPriority} onValueChange={v => setForm(f => f && ({ ...f, defaultPriority: v as typeof form.defaultPriority }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Fields */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Required Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "requireEquipment" as const, label: "Equipment / Line Number", desc: "Require equipment or line number" },
            { key: "requireLocation" as const, label: "Location", desc: "Require physical location" },
            { key: "requireIsolationPoint" as const, label: "Isolation Point", desc: "Require isolation point" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
              <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-2xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Tag Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Certificate Settings Tab ─────────────────────────────────────────────────

function CertificateSettingsTab() {
  const { data, isLoading, refetch } = trpc.settings.certificate.get.useQuery();
  const updateMutation = trpc.settings.certificate.update.useMutation({
    onSuccess: () => { toast.success("Certificate settings saved."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadLogoMutation = trpc.settings.certificate.uploadLogo.useMutation({
    onSuccess: ({ url }) => { setForm(f => f ? { ...f, logoUrl: url } : f); toast.success("Logo uploaded."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const removeLogoMutation = trpc.settings.certificate.removeLogo.useMutation({
    onSuccess: () => { setForm(f => f ? { ...f, logoUrl: "" } : f); toast.success("Logo removed."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Use PNG, JPG, SVG, or WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("File must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadLogoMutation.mutate({ base64, mimeType: file.type as "image/png", fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); };

  const [form, setForm] = useState<{
    certificateTitle: string; headerCompanyName: string; headerSubtitle: string; logoUrl: string;
    signature1Label: string; signature1Name: string; signature1Title: string;
    signature2Label: string; signature2Name: string; signature2Title: string;
    signature3Label: string; signature3Name: string; signature3Title: string;
    footerText: string; showPageNumbers: boolean; showGenerationDate: boolean; showSystemVersion: boolean;
    paperSize: "A4" | "A3" | "Letter" | "Legal"; orientation: "portrait" | "landscape";
    showWorkflowLog: boolean; showExecutionTorque: boolean; showFinalApprovals: boolean;
    showBlindInfo: boolean; showProjectInfo: boolean; showQrCode: boolean;
    showLockStatus: boolean; showAreaInfo: boolean;
    statusBadgeText: string; lockBadgeText: string;
  } | null>(null);

  if (data && !form) {
    setForm({
      certificateTitle: data.certificateTitle,
      headerCompanyName: data.headerCompanyName,
      headerSubtitle: data.headerSubtitle,
      logoUrl: data.logoUrl ?? "",
      signature1Label: data.signature1Label,
      signature1Name: data.signature1Name ?? "",
      signature1Title: data.signature1Title ?? "",
      signature2Label: data.signature2Label,
      signature2Name: data.signature2Name ?? "",
      signature2Title: data.signature2Title ?? "",
      signature3Label: data.signature3Label,
      signature3Name: data.signature3Name ?? "",
      signature3Title: data.signature3Title ?? "",
      footerText: data.footerText ?? "",
      showPageNumbers: data.showPageNumbers === 1,
      showGenerationDate: data.showGenerationDate === 1,
      showSystemVersion: data.showSystemVersion === 1,
      paperSize: (data.paperSize as "A4" | "A3" | "Letter" | "Legal") ?? "A4",
      orientation: (data.orientation as "portrait" | "landscape") ?? "portrait",
      showWorkflowLog: ((data as any).showWorkflowLog ?? 1) === 1,
      showExecutionTorque: ((data as any).showExecutionTorque ?? 1) === 1,
      showFinalApprovals: ((data as any).showFinalApprovals ?? 1) === 1,
      showBlindInfo: ((data as any).showBlindInfo ?? 1) === 1,
      showProjectInfo: ((data as any).showProjectInfo ?? 1) === 1,
      showQrCode: ((data as any).showQrCode ?? 1) === 1,
      showLockStatus: ((data as any).showLockStatus ?? 1) === 1,
      showAreaInfo: ((data as any).showAreaInfo ?? 1) === 1,
      statusBadgeText: (data as any).statusBadgeText ?? "APPROVED",
      lockBadgeText: (data as any).lockBadgeText ?? "LOCKED / FINAL",
    });
  }

  if (isLoading || !form) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  const handleSave = () => {
    updateMutation.mutate({
      certificateTitle: form.certificateTitle,
      headerCompanyName: form.headerCompanyName,
      headerSubtitle: form.headerSubtitle,
      logoUrl: form.logoUrl || null,
      signature1Label: form.signature1Label,
      signature1Name: form.signature1Name || null,
      signature1Title: form.signature1Title || null,
      signature2Label: form.signature2Label,
      signature2Name: form.signature2Name || null,
      signature2Title: form.signature2Title || null,
      signature3Label: form.signature3Label,
      signature3Name: form.signature3Name || null,
      signature3Title: form.signature3Title || null,
      footerText: form.footerText || null,
      showPageNumbers: form.showPageNumbers,
      showGenerationDate: form.showGenerationDate,
      showSystemVersion: form.showSystemVersion,
      paperSize: form.paperSize,
      orientation: form.orientation,
      showWorkflowLog: form.showWorkflowLog,
      showExecutionTorque: form.showExecutionTorque,
      showFinalApprovals: form.showFinalApprovals,
      showBlindInfo: form.showBlindInfo,
      showProjectInfo: form.showProjectInfo,
      showQrCode: form.showQrCode,
      showLockStatus: form.showLockStatus,
      showAreaInfo: form.showAreaInfo,
      statusBadgeText: form.statusBadgeText,
      lockBadgeText: form.lockBadgeText,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Certificate Header</CardTitle>
          <CardDescription className="text-xs text-slate-500">Title and branding shown at the top of printed certificates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate Title</Label>
              <Input value={form.certificateTitle} onChange={e => setForm(f => f && ({ ...f, certificateTitle: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Name on Certificate</Label>
              <Input value={form.headerCompanyName} onChange={e => setForm(f => f && ({ ...f, headerCompanyName: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Subtitle</Label>
              <Input value={form.headerSubtitle} onChange={e => setForm(f => f && ({ ...f, headerSubtitle: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Logo</Label>
              {form.logoUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <img src={form.logoUrl} alt="Logo" className="max-h-14 max-w-[88px] rounded-lg border object-contain" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLogoMutation.mutate()} disabled={removeLogoMutation.isPending} className="text-red-500 hover:bg-red-50">
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              )}
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors ${isDragging ? "border-cyan-400 bg-cyan-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
                <div className="flex flex-col items-center gap-2 py-5 text-center">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">{form.logoUrl ? "Replace logo" : "Upload logo"}</p>
                  <p className="text-xs text-slate-400">PNG, JPG, SVG, WebP · max 2MB</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Certificate Sections</CardTitle>
          <CardDescription className="text-xs text-slate-500">Show or hide sections on the printed certificate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "showBlindInfo" as const, label: "Blind Information", desc: "Area, project, type, size, phase details" },
            { key: "showProjectInfo" as const, label: "Project Information", desc: "Project name and metadata" },
            { key: "showAreaInfo" as const, label: "Area Information", desc: "Area code and name" },
            { key: "showWorkflowLog" as const, label: "Workflow Log", desc: "Phase transition history table" },
            { key: "showExecutionTorque" as const, label: "Execution / Torque", desc: "Torque values and technician info" },
            { key: "showFinalApprovals" as const, label: "Final Approvals", desc: "Approval signatures and dates" },
            { key: "showQrCode" as const, label: "QR Code", desc: "Scannable QR code with certificate data" },
            { key: "showLockStatus" as const, label: "Lock Status Badge", desc: "LOCKED / FINAL indicator" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                {form[key] ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                <div>
                  <div className="text-sm font-bold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              </div>
              <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
            </div>
          ))}
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Status Badge Text</Label>
              <Input value={form.statusBadgeText} onChange={e => setForm(f => f && ({ ...f, statusBadgeText: e.target.value }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Lock Badge Text</Label>
              <Input value={form.lockBadgeText} onChange={e => setForm(f => f && ({ ...f, lockBadgeText: e.target.value }))} className="sbts-input" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Signature Fields</CardTitle>
          <CardDescription className="text-xs text-slate-500">Up to three signature blocks on certificates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {([1, 2, 3] as const).map((num) => {
            const labelKey = `signature${num}Label` as "signature1Label" | "signature2Label" | "signature3Label";
            const nameKey = `signature${num}Name` as "signature1Name" | "signature2Name" | "signature3Name";
            const titleKey = `signature${num}Title` as "signature1Title" | "signature2Title" | "signature3Title";
            return (
              <div key={num} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Signature {num}</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Label</Label>
                    <Input value={form[labelKey]} onChange={e => setForm(f => f && ({ ...f, [labelKey]: e.target.value }))} placeholder="e.g. Prepared By" className="sbts-input bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Name</Label>
                    <Input value={form[nameKey]} onChange={e => setForm(f => f && ({ ...f, [nameKey]: e.target.value }))} placeholder="Full name" className="sbts-input bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Title / Role</Label>
                    <Input value={form[titleKey]} onChange={e => setForm(f => f && ({ ...f, [titleKey]: e.target.value }))} placeholder="Job title" className="sbts-input bg-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Print Options */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Print Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Paper Size</Label>
              <Select value={form.paperSize} onValueChange={v => setForm(f => f && ({ ...f, paperSize: v as typeof form.paperSize }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
                  <SelectItem value="Letter">Letter (8.5 x 11 in)</SelectItem>
                  <SelectItem value="Legal">Legal (8.5 x 14 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Orientation</Label>
              <Select value={form.orientation} onValueChange={v => setForm(f => f && ({ ...f, orientation: v as typeof form.orientation }))}>
                <SelectTrigger className="sbts-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Footer Text</Label>
              <Textarea value={form.footerText} onChange={e => setForm(f => f && ({ ...f, footerText: e.target.value }))} rows={2} className="sbts-input resize-none" />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: "showPageNumbers" as const, label: "Show Page Numbers" },
              { key: "showGenerationDate" as const, label: "Show Generation Date" },
              { key: "showSystemVersion" as const, label: "Show System Version" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-bold text-slate-900">{label}</div>
                <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-2xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Certificate Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Security Settings Tab ────────────────────────────────────────────────────

function SecuritySettingsTab() {
  const { data, isLoading, refetch } = trpc.settings.security.get.useQuery();
  const updateMutation = trpc.settings.security.update.useMutation({
    onSuccess: () => { toast.success("Security settings saved."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<{
    qrPublicAccess: boolean; qrRequireAuth: boolean;
    allowDeleteBlinds: boolean; allowDeleteProjects: boolean; requireDeleteConfirmation: boolean;
    auditTrailEnabled: boolean; auditRetentionDays: number;
    sessionTimeoutMinutes: number; maxLoginAttempts: number; lockoutDurationMinutes: number;
    requireStrongPassword: boolean; minPasswordLength: number;
  } | null>(null);

  if (data && !form) {
    setForm({
      qrPublicAccess: data.qrPublicAccess === 1,
      qrRequireAuth: data.qrRequireAuth === 1,
      allowDeleteBlinds: data.allowDeleteBlinds === 1,
      allowDeleteProjects: data.allowDeleteProjects === 1,
      requireDeleteConfirmation: data.requireDeleteConfirmation === 1,
      auditTrailEnabled: data.auditTrailEnabled === 1,
      auditRetentionDays: data.auditRetentionDays,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes,
      maxLoginAttempts: data.maxLoginAttempts,
      lockoutDurationMinutes: data.lockoutDurationMinutes,
      requireStrongPassword: data.requireStrongPassword === 1,
      minPasswordLength: data.minPasswordLength,
    });
  }

  if (isLoading || !form) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  const handleSave = () => updateMutation.mutate(form);

  return (
    <div className="space-y-6">
      {/* QR Access */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">QR Code Access</CardTitle>
          <CardDescription className="text-xs text-slate-500">Control who can access blind information via QR scan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Public QR Access</div>
              <div className="text-xs text-slate-500">Allow unauthenticated users to view blind status via QR</div>
            </div>
            <Switch checked={form.qrPublicAccess} onCheckedChange={v => setForm(f => f && ({ ...f, qrPublicAccess: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Require Authentication for QR</div>
              <div className="text-xs text-slate-500">Force login before showing detailed blind data</div>
            </div>
            <Switch checked={form.qrRequireAuth} onCheckedChange={v => setForm(f => f && ({ ...f, qrRequireAuth: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Delete Policies */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Delete Policies</CardTitle>
          <CardDescription className="text-xs text-slate-500">Control destructive operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "allowDeleteBlinds" as const, label: "Allow Delete Blinds", desc: "Permit permanent deletion of blind records" },
            { key: "allowDeleteProjects" as const, label: "Allow Delete Projects", desc: "Permit permanent deletion of projects" },
            { key: "requireDeleteConfirmation" as const, label: "Require Delete Confirmation", desc: "Show confirmation dialog before any delete" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
              <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Enable Audit Trail</div>
              <div className="text-xs text-slate-500">Log all user actions for compliance</div>
            </div>
            <Switch checked={form.auditTrailEnabled} onCheckedChange={v => setForm(f => f && ({ ...f, auditTrailEnabled: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Retention (days)</Label>
            <Input type="number" min={7} max={365} value={form.auditRetentionDays} onChange={e => setForm(f => f && ({ ...f, auditRetentionDays: parseInt(e.target.value) || 90 }))} className="sbts-input w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Session & Password */}
      <Card className="sbts-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-extrabold text-slate-950">Session & Password Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Session Timeout (minutes)</Label>
              <Input type="number" min={15} max={1440} value={form.sessionTimeoutMinutes} onChange={e => setForm(f => f && ({ ...f, sessionTimeoutMinutes: parseInt(e.target.value) || 480 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Max Login Attempts</Label>
              <Input type="number" min={3} max={20} value={form.maxLoginAttempts} onChange={e => setForm(f => f && ({ ...f, maxLoginAttempts: parseInt(e.target.value) || 5 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Lockout Duration (minutes)</Label>
              <Input type="number" min={5} max={60} value={form.lockoutDurationMinutes} onChange={e => setForm(f => f && ({ ...f, lockoutDurationMinutes: parseInt(e.target.value) || 15 }))} className="sbts-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Min Password Length</Label>
              <Input type="number" min={6} max={32} value={form.minPasswordLength} onChange={e => setForm(f => f && ({ ...f, minPasswordLength: parseInt(e.target.value) || 8 }))} className="sbts-input" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Require Strong Password</div>
              <div className="text-xs text-slate-500">Enforce uppercase, lowercase, number, and special character</div>
            </div>
            <Switch checked={form.requireStrongPassword} onCheckedChange={v => setForm(f => f && ({ ...f, requireStrongPassword: v }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-2xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Notification Settings Tab ────────────────────────────────────────────────

function NotificationSettingsTab() {
  const { data, isLoading, refetch } = trpc.settings.notifications.get.useQuery();
  const updateMutation = trpc.settings.notifications.update.useMutation({
    onSuccess: () => { toast.success("Notification preferences saved."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState<{
    registrationRequest: boolean; registrationApproved: boolean; registrationRejected: boolean;
    blindPhaseChanged: boolean; blindPhaseApproval: boolean; blindAssigned: boolean;
    projectCreated: boolean; projectStatusChanged: boolean; phaseOwnerAssigned: boolean;
    workflowUpdated: boolean; systemAnnouncement: boolean;
  } | null>(null);

  if (data && !form) {
    setForm({
      registrationRequest: data.registrationRequest === 1,
      registrationApproved: data.registrationApproved === 1,
      registrationRejected: data.registrationRejected === 1,
      blindPhaseChanged: data.blindPhaseChanged === 1,
      blindPhaseApproval: data.blindPhaseApproval === 1,
      blindAssigned: data.blindAssigned === 1,
      projectCreated: data.projectCreated === 1,
      projectStatusChanged: data.projectStatusChanged === 1,
      phaseOwnerAssigned: data.phaseOwnerAssigned === 1,
      workflowUpdated: data.workflowUpdated === 1,
      systemAnnouncement: data.systemAnnouncement === 1,
    });
  }

  if (isLoading || !form) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  const handleSave = () => updateMutation.mutate(form);

  const categories = [
    { title: "Registration Events", items: [
      { key: "registrationRequest" as const, label: "New Registration Request", desc: "When a new user submits registration" },
      { key: "registrationApproved" as const, label: "Registration Approved", desc: "When admin approves a user" },
      { key: "registrationRejected" as const, label: "Registration Rejected", desc: "When admin rejects a user" },
    ]},
    { title: "Blind & Phase Events", items: [
      { key: "blindPhaseChanged" as const, label: "Phase Changed", desc: "When a blind moves to a new phase" },
      { key: "blindPhaseApproval" as const, label: "Phase Approval", desc: "When electronic approval is submitted" },
      { key: "blindAssigned" as const, label: "Blind Assigned", desc: "When a blind is assigned to a user" },
    ]},
    { title: "Project Events", items: [
      { key: "projectCreated" as const, label: "Project Created", desc: "When a new project is created" },
      { key: "projectStatusChanged" as const, label: "Project Status Changed", desc: "When project status is updated" },
      { key: "phaseOwnerAssigned" as const, label: "Phase Owner Assigned", desc: "When user is assigned as phase owner" },
    ]},
    { title: "System Events", items: [
      { key: "workflowUpdated" as const, label: "Workflow Updated", desc: "When workflow template is modified" },
      { key: "systemAnnouncement" as const, label: "System Announcement", desc: "General system announcements" },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These settings control which operational events generate in-app notifications. Email and Teams integrations can be attached later.
        </p>
      </div>

      {categories.map(({ title, items }) => (
        <Card key={title} className="sbts-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-extrabold text-slate-950">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <Switch checked={form[key]} onCheckedChange={v => setForm(f => f && ({ ...f, [key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 rounded-2xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const ActiveIcon = tabs.find(t => t.key === activeTab)?.icon ?? Settings;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="System Settings Center"
        description="Full operational control — identity, tags, certificates, security, and notifications"
      />

      {/* Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full sm:w-64 shrink-0">
          <div className="sbts-card overflow-hidden p-2">
            <div className="space-y-1">
              {tabs.map(({ key, label, icon: Icon, description }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                    activeTab === key
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${activeTab === key ? "text-cyan-300" : "text-slate-400"}`} />
                  <div>
                    <div className={`text-sm font-bold ${activeTab === key ? "text-white" : "text-slate-900"}`}>{label}</div>
                    <div className={`text-xs ${activeTab === key ? "text-slate-300" : "text-slate-500"}`}>{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2">
            <ActiveIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-700">{tabs.find(t => t.key === activeTab)?.label}</span>
          </div>
          {activeTab === "general" && <GeneralSettingsTab />}
          {activeTab === "defaultTag" && <DefaultTagSettingsTab />}
          {activeTab === "certificate" && <CertificateSettingsTab />}
          {activeTab === "security" && <SecuritySettingsTab />}
          {activeTab === "notifications" && <NotificationSettingsTab />}
        </div>
      </div>
    </div>
  );
}
