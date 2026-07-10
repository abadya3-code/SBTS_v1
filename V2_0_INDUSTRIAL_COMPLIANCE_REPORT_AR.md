# SBTS Professional v2.0 — Industrial Compliance & Field Execution Package

## الهدف
هذه النسخة تنفذ المرحلة الثانية من تقرير الفريق الهندسي: تحويل SBTS من tracker قوي إلى نظام ميداني أقرب لمتطلبات Oil & Gas Maintenance / Inspection / Safety.

## ما تم تنفيذه في v2.0

### 1) Field Compliance Center
أضيفت صفحة جديدة:
```text
/compliance
```
وتحتوي على:
- Blind expiry watch.
- Safety checklist workspace.
- Photo/document evidence upload pilot.
- Torque record entry.
- NDE / MTR / Gasket / Leak Test / Punch List records.
- Per-blind compliance counters.

### 2) جداول قاعدة بيانات جديدة
أضيفت الجداول التالية إلى `drizzle/schema.ts`:
```text
blind_evidence
blind_safety_checklists
blind_torque_records
blind_inspection_records
```

### 3) API جديد
أضيف:
```text
server/db/fieldCompliance.ts
server/routers/fieldCompliance.ts
trpc.fieldCompliance.summary
trpc.fieldCompliance.blind
trpc.fieldCompliance.defaultChecklist
trpc.fieldCompliance.saveChecklist
trpc.fieldCompliance.addEvidence
trpc.fieldCompliance.addTorque
trpc.fieldCompliance.addInspection
```

### 4) Permissions جديدة
أضيفت صلاحيات:
```text
compliance.view
compliance.manage
```
وأضيفت إلى أدوار مناسبة مثل Admin, Technician, QC, Safety, T&I Engineer, Inspection, Metal Foreman حسب الحاجة.

### 5) Seed upgrade للأنظمة القائمة
تم تعديل `seedAccessControl()` ليضيف الصلاحيات والأدوار الناقصة حتى لو كانت قاعدة البيانات موجودة مسبقاً، بدل أن يتوقف بمجرد وجود أول permissions.

### 6) Navigation / Route
تم ربط صفحة Compliance في:
```text
client/src/App.tsx
client/src/lib/mockData.ts
```

### 7) Audit integration
كل عمليات Compliance الجديدة تسجل في audit_events:
- compliance.checklist.save
- compliance.evidence.add
- compliance.torque.add
- compliance.inspection.add

## نتائج الفحص الثابت
| الفحص | النتيجة |
|---|---:|
| Missing local imports | 0 |
| Arabic executable text | 0 |
| Routes | 23 |
| Pages | 20 |
| Coming soon messages | 0 |
| To-be-implemented messages | 0 |

## أكبر الصفحات التي تحتاج refactor لاحقاً
| الملف | الأسطر |
|---|---:|
| `SystemSettings.tsx` | 2676 |
| `ProjectDetail.tsx` | 1873 |
| `Reports.tsx` | 1058 |
| `UserManagement.tsx` | 953 |
| `Blinds.tsx` | 919 |
| `UserProfile.tsx` | 726 |
| `WorkflowStudio.tsx` | 583 |
| `Register.tsx` | 560 |
| `Dashboard.tsx` | 381 |
| `Login.tsx` | 336 |

## حدود v2.0
هذه النسخة أضافت foundation صناعي حقيقي، لكنها لا تزال pilot-level في تخزين الملفات؛ evidence يتم حفظه inline dataUrl للسهولة على Railway. في Production يجب نقله إلى S3/MinIO أو storage داخلي.

## المتبقي لـ v2.1
- QR field verification page `/qr/blind/:token`.
- PWA/offline draft mode.
- PTW and LOTO modules.
- Risk assessment per blind.
- Email/SMS critical alerts.
- Dedicated pagination for very large tables.
- OpenAPI/Swagger.
