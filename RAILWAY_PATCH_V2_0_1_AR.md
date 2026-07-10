# SBTS v2.0.1 Railway Pre-deploy Migration Patch

## سبب التصحيح
فشل نشر v2.0 في Railway في مرحلة Pre-deploy لأن سكربت `db:push` كان يشغل:

```bash
drizzle-kit generate && drizzle-kit migrate
```

وهذا غير مناسب في Railway لأن `generate` لا يجب أن يعمل وقت النشر. توليد migration يجب أن يتم محلياً وتُرفع ملفات SQL مع Git، أما Railway يجب أن ينفذ migrations فقط.

## ما تم تعديله

1. إضافة migration ثابت:

```text
drizzzle/0013_industrial_compliance_field_execution.sql
```

2. تحديث journal:

```text
drizzzle/meta/_journal.json
```

3. تعديل `package.json`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit migrate",
"railway:migrate": "pnpm db:migrate"
```

## المطلوب بعد رفع patch
نفذ:

```powershell
git add package.json drizzle/0013_industrial_compliance_field_execution.sql drizzle/meta/_journal.json RAILWAY_PATCH_V2_0_1_AR.md
git commit -m "Fix Railway v2.0 predeploy migration command"
git push origin main
```

بعد نجاح النشر يجب أن تظهر في Railway MySQL الجداول:

```text
blind_evidence
blind_safety_checklists
blind_torque_records
blind_inspection_records
```
