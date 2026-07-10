# SBTS Professional v2.2 — PWA Offline Mobile + Shift Handover

## الهدف
هذه النسخة تكمل v2.1 وتغطي ملاحظات الفنيين والميدان حول استخدام التطبيق في ظروف الشبكة الضعيفة، وحاجة المشرفين إلى handover واضح بين الشفتات.

## ما تم تنفيذه

### 1) Offline Mobile Center
تمت إضافة صفحة جديدة:

```text
/mobile
```

وتحتوي على:
- جهاز Field Device ID محلي.
- حفظ ملاحظات Field Drafts محلياً في localStorage عند ضعف الشبكة.
- Sync للـ drafts إلى قاعدة البيانات عند توفر الاتصال.
- عرض queue محلي: Queued / Synced.
- دعم أنواع draft مثل field_note, safety_observation, photo_note, handover_note, issue_followup.

### 2) PWA Foundation
تمت إضافة:

```text
client/public/manifest.webmanifest
client/public/sw.js
client/public/icons/sbts-icon.svg
```

وتم ربطها في:

```text
client/index.html
client/src/main.tsx
```

كما تم حذف analytics script الذي كان يعطي warnings بسبب متغيرات VITE_ANALYTICS غير معرفة.

### 3) Shift Handover
تمت إضافة نموذج handover للشفتات يحتوي على:
- Shift date
- Shift name
- Area code
- Project ID
- Summary
- Open risks
- Next shift priorities
- Handover to

### 4) جداول قاعدة البيانات الجديدة
تمت إضافة migration:

```text
drizzle/0015_field_mobile_offline_handover.sql
```

ويضيف:

```text
field_offline_drafts
shift_handover_records
```

### 5) API جديد داخل fieldCompliance
تمت إضافة endpoints:

```text
fieldCompliance.mobileSummary
fieldCompliance.offlineDrafts
fieldCompliance.saveOfflineDraft
fieldCompliance.shiftHandovers
fieldCompliance.submitShiftHandover
```

### 6) Navigation & Access
تمت إضافة menu جديد:

```text
Offline Mobile -> /mobile
```

وتمت إضافة صلاحيات:

```text
field.mobile
handover.manage
```

### 7) Auth cleanup
تم تنظيف تحذير OAuth القديم من logs لأن النظام يعمل حالياً standalone email/password.

## نتائج الفحص الثابت
| الفحص | النتيجة |
|---|---:|
| Missing local imports | 0 |
| Arabic executable text | 0 |
| Routes | 26 |
| New migration | 0015 موجود |
| Coming soon messages | 0 |
| To-be-implemented messages | 0 |
| VITE analytics warnings | Removed from index |

## أكبر الصفحات التي لا تزال تحتاج refactor
| الملف | عدد الأسطر |
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

## ملاحظات مهمة
- Offline drafts حالياً تحفظ النصوص والملاحظات، وليست بديلاً عن تنفيذ workflow actions تلقائياً. هذا مقصود حتى لا يتم تنفيذ عمليات حساسة أثناء offline بدون مراجعة.
- PWA caching للـ app shell والملفات الثابتة. عمليات DB تبقى عبر API عند الاتصال.
- الخطوة القادمة v2.3 يفضل أن تكون: SLA / Overdue / Daily Progress / Management Reporting / Shift Dashboard.
