# SBTS Professional v2.1 — Field Mobile, QR Verification, PTW/LOTO & Risk Assessment

## الهدف
هذه النسخة تكمل v2.0 وتضيف طبقة ميدانية حقيقية للتطبيق، بحيث لا يكون النظام مجرد إدخال بيانات Compliance من المكتب، بل يقترب من استخدام الفني والمشرف والسلامة في الموقع.

## ما تم تنفيذه

### 1. Field Mobile Center
تمت إضافة صفحة جديدة:

```text
/field
```

الصفحة مخصصة للـ mobile/tablet وتشمل:
- اختيار Project ID و Blind Tag.
- اختيار المرحلة الحالية.
- توليد QR Field Verification token.
- إدخال PTW / LOTO.
- تحديد مصادر الطاقة.
- تسجيل Gas Test status.
- عمل Risk Assessment للمرحلة.

### 2. Public QR Verification Page
تمت إضافة صفحة عامة read-only:

```text
/qr/blind/:token
```

تعرض عند المسح:
- Blind tag.
- Project ID.
- Current phase.
- Type / Size / Priority.
- Equipment / isolation point.
- Compliance counts.
- Latest PTW / LOTO.
- Latest risk assessment.

### 3. PTW / LOTO Records
تمت إضافة جدول:

```text
blind_ptw_loto_records
```

ويحفظ:
- PTW number.
- LOTO number.
- Phase.
- Permit status.
- Isolation status.
- Energy sources.
- Gas test required/result.
- Verifier name.
- Expiry time.

### 4. Risk Assessment Records
تمت إضافة جدول:

```text
blind_risk_assessments
```

ويحفظ:
- Phase.
- Initial risk level.
- Residual risk.
- Hazards JSON.
- Controls JSON.
- Status.
- Assessor.

### 5. QR Tokens & Scan Logs
تمت إضافة:

```text
qr_blind_tokens
qr_scan_logs
```

الهدف:
- توليد token لكل blind.
- ربط token بالمشروع والـ blind.
- تسجيل كل scan.
- معرفة active/expired/invalid scan.

### 6. API / tRPC
تم توسيع `fieldCompliance` router بإضافة:

```text
fieldCompliance.defaultRiskModel
fieldCompliance.createQrToken
fieldCompliance.verifyQrToken
fieldCompliance.saveRiskAssessment
fieldCompliance.addPtwLoto
```

### 7. Audit Integration
العمليات الجديدة تسجل في Audit Events:

```text
compliance.qr.rotate
compliance.risk_assessment.save
compliance.ptw_loto.add
```

### 8. Navigation
تمت إضافة صفحة:

```text
Field Mobile
```

إلى القائمة الجانبية، وربطها بالأدوار الموجودة في seed data.

## ملفات مهمة تم تعديلها

```text
package.json
drizzle/schema.ts
drizzle/0014_qr_ptw_loto_risk.sql
drizzle/meta/_journal.json
server/db/fieldCompliance.ts
server/db/index.ts
server/routers/fieldCompliance.ts
server/db/seed.ts
client/src/App.tsx
client/src/lib/mockData.ts
client/src/pages/ComplianceCenter.tsx
client/src/pages/FieldExecutionCenter.tsx
client/src/pages/FieldVerification.tsx
```

## ملاحظات Railway
هذه النسخة تستخدم نفس إصلاح v2.0.1:

```text
db:push = drizzle-kit migrate
```

ولا تستخدم `drizzle-kit generate` في pre-deploy.

## بعد النشر يجب ظهور الجداول التالية في MySQL

```text
qr_blind_tokens
qr_scan_logs
blind_risk_assessments
blind_ptw_loto_records
```

مع جداول v2.0:

```text
blind_evidence
blind_safety_checklists
blind_torque_records
blind_inspection_records
```

## اختبار سريع بعد النشر

1. افتح `/compliance` وتأكد من ظهور زر `Open Field Mobile`.
2. افتح `/field`.
3. أدخل Project ID و Blind Tag موجودين.
4. اضغط Generate QR token.
5. افتح الرابط الناتج `/qr/blind/:token`.
6. أدخل PTW / LOTO record.
7. أدخل Risk Assessment.
8. افتح Audit Center وتأكد من ظهور events الجديدة.

## ما بقي لـ v2.2
- PWA manifest + service worker offline drafts.
- Photo capture direct camera mode.
- QR scanner from camera inside app.
- Shift handover and daily field report.
- Permit workflow approval routing.
- Risk matrix heatmap and ISA compliance scoring.
