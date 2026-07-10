# SBTS Professional v1.9 — Engineering Team Response Package

## الهدف
هذه النسخة تستجيب لتقرير الفريق الهندسي متعدد التخصصات، وتركز على Critical Production Fixes:
- تحويل Dashboard من mock/static إلى live DB.
- إنشاء Audit backend حقيقي.
- إضافة حقول صناعية أساسية للـ blind.
- تقوية Security / Logging.
- تقليل العناصر العشوائية وغير المربوطة.
- تحويل Access Control ليقرأ ويحفظ من قاعدة البيانات بدل draft محلي فقط.

## ما تم تنفيذه في v1.9

### 1) Dashboard Live DB
- تم إزالة اعتماد Dashboard على `phases` و `recentEvents` من `mockData`.
- Dashboard يستخدم الآن `trpc.reports.globalStats`.
- يعرض:
  - Total blinds
  - Completed blinds
  - In-progress blinds
  - Critical blinds
  - Phase distribution
  - Priority distribution
  - Recent database workflow activity

### 2) Audit Events Backend
تمت إضافة جدول جديد:
```text
audit_events
```

الحقول:
```text
id
actorOpenId
actorName
action
entityType
entityId
beforeJson
afterJson
ipAddress
userAgent
hash
previousHash
createdAt
```

تمت إضافة:
- `server/db/audit.ts`
- `server/routers/audit.ts`
- `trpc.audit.list`
- `trpc.audit.summary`

وتم ربط Audit Center بالجدول الحقيقي بدلاً من الاعتماد على notifications فقط.

### 3) Audit Hooks
تم تسجيل أحداث رئيسية:
- إنشاء مشروع
- إضافة blind
- Bulk add blinds
- تحديث blind
- Approval / revoke لمرحلة
- تحديث Project workflow settings
- تحديث Access Control roles
- تحديث user roles
- تحديث system role
- قبول/رفض تسجيل المستخدم
- تحديث إعدادات General / Tag / Certificate / Security / Notifications

### 4) Industrial Blind Fields
تمت إضافة حقول هندسية أساسية إلى `blinds`:
```text
pressureClass
material
flangeType
gasketType
boltSize
torqueValue
thickness
temperatureRating
pidReference
isoDrawingNumber
installationDate
removalDate
expiryDate
```

وتم ربطها بـ:
- `drizzle/schema.ts`
- `server/db/types.ts`
- `server/db/blinds.ts`
- `server/routers/shared.ts`
- `client/src/pages/ProjectDetail.tsx`

### 5) Access Control DB-backed
- صفحة Access Control لم تعد مجرد draft محلي.
- تقرأ من:
```text
trpc.accessControl.model
```
- تحفظ من:
```text
trpc.accessControl.updateRoles
```

### 6) Security / IT Hardening
- أضيف request logger على API.
- Security headers وRate limit موجودة ومستمرة من النسخ السابقة.
- تم الحفاظ على session timeout من Security Settings.

### 7) English-only executable UI
- تم تنظيف النصوص العربية من الواجهة التنفيذية والـ backend notification text.
- نتيجة الفحص: `0` Arabic executable characters خارج ملفات الاختبار.

## نتائج الفحص الثابت
| الفحص | النتيجة |
|---|---:|
| Missing local imports | 0 |
| Routes | 22 |
| Pages | 19 |
| Arabic executable text | 0 |
| Coming soon messages | 0 |
| To-be-implemented messages | 0 |

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

## ما لم يتم تنفيذه بعد من تقرير الفريق
v1.9 لا تغطي كل التقرير؛ هي تغطي Sprint 1 + بداية Industrial Fields.

المتبقي لـ v2.0 / v2.1:
1. Pagination كامل في Projects / Users / Reports tables.
2. Photo Evidence per phase.
3. Safety Checklist per phase.
4. Blind Expiry alerts.
5. QR field verification page `/qr/blind/:token`.
6. PTW / LOTO / Risk Assessment modules.
7. NDE / MTR / gasket batch / leak test records.
8. Email/SMS notifications.
9. PWA / offline mode.
10. OpenAPI/Swagger documentation.
11. CMMS integration preparation.

## ملاحظات تشغيل
بعد رفع النسخة:
```bash
pnpm install --frozen-lockfile
pnpm db:push
pnpm check
pnpm test
pnpm build
```

إذا نجح Railway build ولكن ظهر خطأ DB، غالباً يحتاج `pnpm db:push` لأن v1.9 أضافت أعمدة وجداول جديدة.
