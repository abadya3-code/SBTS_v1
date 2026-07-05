# CHANGELOG — SBTS Professional Edition

> سجل تاريخي لجميع مراحل تطوير نظام تتبع الستائر الذكي (SBTS).
> يُستخدم هذا الملف كمرجع للمهندسين لمعرفة ما تم بناؤه ومتى وسبب القرارات الرئيسية.

---

## [v0.8] — 2026-07-03 · المرحلة 7: نظام التسجيل والمصادقة

**الـ checkpoint:** `466f185c`

### قاعدة البيانات
- إضافة حقول جديدة لجدول `users`: `userStatus` (pending/active/rejected)، `department`، `specialty`، `employeeNumber`، `registrationNote`، `approvedByOpenId`، `approvedAt`
- تطبيق migration SQL على قاعدة البيانات

### Backend (server)
- إضافة 4 helpers في `server/db.ts`: `completeUserRegistration`، `approveUserRegistration`، `rejectUserRegistration`، `getPendingUsers`
- إضافة 4 procedures في `accessControlRouter`: `pendingUsers` (admin only)، `approveUser` (admin only)، `rejectUser` (admin only)، `completeRegistration` (protected)
- إرسال إشعار تلقائي للمدير عند وصول طلب تسجيل جديد عبر `notifyOwner`

### Frontend
- إنشاء `Login.tsx`: صفحة دخول احترافية بتصميم Industrial مع OAuth — خارج AppShell
- إنشاء `Register.tsx`: نموذج إكمال البيانات المهنية (قسم، تخصص، رقم موظف، ملاحظة)
- إنشاء `Approve.tsx`: صفحة انتظار الموافقة مع polling كل 30 ثانية وعرض حالة الطلب
- تحديث `AppShell.tsx`: إضافة auth guard يوجّه المستخدم تلقائياً حسب حالته، عرض بيانات المستخدم الحقيقية (اسم، صورة، تخصص)، زر تسجيل خروج، شارة عدد الطلبات المعلقة للمدير
- تحديث `UserManagement.tsx`: إضافة قسم "طلبات التسجيل المعلقة" مع أزرار موافقة ورفض فورية
- تحديث `App.tsx`: إضافة routes خارج AppShell للمسارات العامة (`/login`, `/register`, `/approve`)

### الاختبارات
- إضافة `server/registration.test.ts` (7 اختبارات جديدة)
- إجمالي: 69 اختبار ناجح — TypeScript: 0 أخطاء

---

## [v0.7] — 2026-06-xx · Permission Matrix & Access Control

**الـ checkpoint:** `94d1c11`

### Frontend
- إضافة تبويب **Permission Matrix** مرئي في Access Control Center
- مصفوفة تفاعلية للأدوار والصلاحيات مع إمكانية التعديل المباشر
- دعم التصفية، البحث، ومقارنة الأدوار
- تصدير مصفوفة الصلاحيات إلى CSV

---

## [v0.6] — 2026-06-xx · User Management & Access Control Center

**الـ checkpoint:** `c42ce0c`

### قاعدة البيانات
- إضافة جدول `user_role_assignments` لربط المستخدمين بالأدوار

### Backend (server)
- إضافة 6 helpers في `server/db.ts`: `getAllUsers`، `assignRolesToUser`، `updateUserSystemRole`، `updateAccessControlModel`، `createAccessRole`، `deleteAccessRole`
- إضافة 6 procedures في `accessControlRouter`: `users`، `assignRoles`، `updateSystemRole`، `updateRoles`، `createRole`، `deleteRole`

### Frontend
- بناء `UserManagement.tsx`: جدول المستخدمين مع تعديل الأدوار
- تحديث `AccessControl.tsx`: ربط كامل بـ tRPC API بدلاً من mockData
- واجهة إنشاء دور جديد (Dialog) مع حفظ في قاعدة البيانات
- واجهة حذف الأدوار مع تأكيد، ونسخ الأدوار
- إضافة مسار `/users` في App.tsx وربطه بالقائمة الجانبية

### الاختبارات
- 62 اختبار ناجح — TypeScript: 0 أخطاء — Build: نجح

---

## [v0.5b] — 2026-05-xx · Logo Upload Feature

**الـ checkpoint:** `897548c`

### Backend (server)
- إضافة procedure `uploadLogo`: يقبل base64 ويرفع إلى S3 مع تحقق النوع والحجم
- إضافة procedure `removeLogo`: يحذف logoUrl من قاعدة البيانات

### Frontend
- تحديث Certificate Settings: إضافة drag-and-drop لرفع الشعار
- معاينة فورية للشعار بعد الرفع مع زر Remove
- الاحتفاظ بخيار إدخال URL كبديل
- التحقق من نوع الملف (PNG, JPG, SVG, WebP) والحجم (max 2MB)

---

## [v0.5a] — 2026-05-xx · Certificate Settings Integration with Reports

**الـ checkpoint:** `0505245`

### Frontend
- إنشاء hook مشترك `useCertificateSettings` لجلب إعدادات الشهادة من الخادم
- إنشاء دوال مساعدة مشتركة: `openPrintWindow`، `buildReportHeader`، `buildSignaturesSection`، `buildReportFooter`، `getPaperCSS`
- تحديث جميع مكونات التقارير الأربعة لاستخدام الإعدادات الحقيقية تلقائياً عند الطباعة: `ProjectSummaryReport`، `WorkflowPhasesReport`، `StatisticsReport`، `BlindsDetailedReport`

---

## [v0.5] — 2026-05-xx · System Settings (General, Default Tag, Certificate)

### قاعدة البيانات
- إضافة 3 جداول: `systemSettings`، `defaultTagSettings`، `certificateSettings`

### Backend (server)
- إضافة helpers في `server/db.ts` للإعدادات الثلاثة
- إضافة `settingsRouter` في `server/routers.ts`

### Frontend
- بناء `SystemSettings.tsx` مع ثلاثة تبويبات:
  - **General Settings**: اللغة، المنطقة الزمنية، الإشعارات، الشركة
  - **Default Tag Settings**: بادئة Tag، الحجم الافتراضي، النوع، الأولوية
  - **Certificate Settings**: اسم الشركة، الشعار، التوقيعات، ترويسة الشهادة
- إضافة مسار `/settings` في App.tsx

---

## [v0.4b] — 2026-05-xx · Professional Printing & Reports System

### Frontend
- إنشاء نظام تقارير متكامل مع 4 أنواع:
  - **Project Summary Report**: ملخص شامل للمشروع
  - **Workflow Phases Report**: تقرير مراحل سير العمل
  - **Blinds Detailed Report**: تقرير الستائر المفصل
  - **Statistics Report**: تقرير الإحصائيات والمقاييس
- معاينة قبل الطباعة (Print Preview)
- تصدير إلى PDF احترافي وExcel مع التنسيق
- خيارات طباعة متقدمة (حجم الورق، الاتجاه، الهوامش)

---

## [v0.4a] — 2026-05-xx · Advanced BlindsRegistry Features

### Frontend
- تصدير جدول BlindsRegistry إلى Excel مع تنسيق احترافي
- نظام ترقيم (Pagination) متقدم مع التحكم في عدد الصفوف (10, 25, 50, 100)
- البحث والفرز على الصفحات المختلفة

---

## [v0.4] — 2026-05-xx · Blind Detail Redesign, PDF Exports, Phase Approval

**الـ checkpoint:** `1f9bc0a`

### قاعدة البيانات
- إضافة نموذج بيانات للاعتماد الإلكتروني لكل فيز داخل كل Blind
- ربط اعتماد الفيز بسجل النشاط (activity log)

### Backend (server)
- إضافة procedure `approveBlindPhase` مع فرض قواعد سير العمل
- تحويل Export certificates وExport tags إلى تصدير PDF فعلي

### Frontend
- بناء `BlindDetail.tsx`: صفحة تفاصيل Blind مستقلة
  - أعلى الصفحة: بيانات المنطقة، المشروع، الموقع، المقاس، الريت، الحالة
  - جسم الصفحة: جميع الفيزات على اليسار مع الحالة والـ log على اليمين
- أزرار اعتماد/إلغاء اعتماد لكل فيز مع واجهة احترافية
- نقل تفعيل/تعطيل شرط Slip Blind Foreman Metal إلى إعدادات المشروع
- Execution Brief في سطر واحد مع تمييز كل قسم بلون قابل للإعداد

---

## [v0.3b] — 2026-05-05 · Project Blind Operations, Bulk Import, Phase Owners

**الـ checkpoint:** `b9dc8a7`

### قاعدة البيانات
- إضافة جدول `project_phase_owners` لربط مراحل المشروع بمسؤولين متعددين

### Backend (server)
- إضافة procedures: `addBlind`، `bulkAddBlinds`، `updateBlind`، `settings.update`
- فرض صلاحيات Phase Owner: المسؤول المحدد فقط يمكنه التعديل
- دعم Slip Blind gates: إلزامية موافقة Foreman Metal وتأكيد الدمج

### Frontend
- نموذج Add Blind مع أنواع: Slip Blind، Drop Spool، Isolation
- حقول: rate، equipment (بدلاً من lineNumber)، نوع Blind
- واجهة Bulk Paste من Excel مع معاينة قبل الحفظ وزر Load example
- إعدادات Phase Owners متعددة الأشخاص مع avatarUrl
- مركز تصدير وطباعة موحد للشهادات والـ Tags

---

## [v0.3a] — 2026-05-05 · Project Dashboard Components

**الـ checkpoint:** `060907b`

### Frontend
- إنشاء مكونات Dashboard داخل ProjectDetail:
  - `ProjectHeader`: معلومات المشروع والحالة والتقدم
  - `MetricsCards`: المقاييس الرئيسية
  - `WorkflowPhases`: مراحل سير العمل ومسؤولي المراحل
  - `RecentActivity`: الأنشطة الأخيرة
  - `QuickActions`: الإجراءات السريعة
  - `BlindsRegistry`: جدول الستائر مع البحث والفرز

---

## [v0.3] — 2026-05-05 · Project Detail & Blinds Linkage

**الـ checkpoint:** `e4d4c29`

### قاعدة البيانات
- إضافة جدول `blinds` مع علاقة بجدول `projects`

### Backend (server)
- إضافة procedure `projects.detail` يعيد تفاصيل المشروع مع سجلات الستائر
- إضافة procedure `projects.blindDetail` لتفاصيل Blind محدد

### Frontend
- بناء `ProjectDetail.tsx`: صفحة تفاصيل مشروع مع ملخص ومؤشرات وسجلات الستائر
- ربط أزرار "Open project" في صفحة Projects بمسار تفاصيل المشروع

---

## [v0.2] — 2026-05-05 · Areas and Projects Flow

**الـ checkpoint:** `ece5815`

### قاعدة البيانات
- إضافة جدول `areas` مع علاقة بجدول `projects`
- Seed للمناطق التشغيلية الأولية لـ SBTS

### Backend (server)
- إضافة `areasRouter`: `list`، `getById`، `create`
- إضافة `projects.listByArea` لمشاريع منطقة محددة

### Frontend
- بناء `Areas.tsx`: كروت المناطق مع عدد المشاريع وحالة النشاط
- تحديث `Projects.tsx`: دعم عرض كل المشاريع أو مشاريع منطقة محددة
- انتقال سياقي بين المناطق والمشاريع بدون فقدان السياق

---

## [v0.1b] — 2026-05-04 · Workflow Studio Drag-and-Drop UX

**الـ checkpoint:** `0ee3e76`

### Frontend
- إضافة واجهة سحب وإفلات مرئية لإعادة ترتيب مراحل مسار العمل
- تحديث أرقام المراحل وحفظ الترتيب الجديد عبر API وقاعدة البيانات

---

## [v0.1a] — 2026-05-04 · Workflow Studio APIs & Database Integration

**الـ checkpoint:** `b493e22`

### قاعدة البيانات
- إضافة جداول: `workflow_templates`، `workflow_phases`، `access_roles`، `role_permissions`
- Seed آمن للبيانات الحالية

### Backend (server)
- إضافة `workflowRouter`: CRUD كامل للـ workflows والمراحل
- إضافة `accessControlRouter` (نسخة أولية): `model`

### Frontend
- ربط Workflow Studio بالـ APIs بدلاً من mockData
- إضافة حالات تحميل، حفظ، أخطاء، وتنبيهات نجاح

---

## [v0.1] — 2026-05-04 · Initial Frontend Build

**الـ checkpoint:** `a6d0ba0`

### Frontend (الإطار الأساسي)
- تصميم Industrial Command Center Minimalism
- `AppShell.tsx`: الإطار الرئيسي مع sidebar، header، theme toggle
- `Dashboard.tsx`: لوحة التحكم الرئيسية
- `Projects.tsx`: قائمة المشاريع
- `Blinds.tsx`: سجل الستائر
- `AccessControl.tsx`: مركز التحكم بالوصول (نسخة أولية بـ mockData)
- `WorkflowStudio.tsx`: محرر مسارات العمل (نسخة أولية)
- هيكل React + Vite + Tailwind 4 + tRPC + Drizzle ORM

---

## ملاحظات للمهندسين

| الملف | الوصف | الموقع |
|-------|-------|--------|
| `drizzle/schema.ts` | تعريف جميع جداول قاعدة البيانات | نقطة البداية لأي تعديل في البيانات |
| `server/db.ts` | جميع helpers للتعامل مع قاعدة البيانات | يحتوي على 1,900+ سطر — مرشح للتقسيم |
| `server/routers.ts` | جميع tRPC procedures | يحتوي على 6 routers في ملف واحد |
| `client/src/lib/mockData.ts` | بيانات ثابتة للـ navItems وcatalogs | لا يزال يُستخدم لـ navItems وpermissionGroups |
| `client/src/pages/` | جميع صفحات التطبيق | 12 صفحة |
| `client/src/components/layout/AppShell.tsx` | الإطار الرئيسي مع auth guard | يحتوي على منطق المصادقة والتوجيه |

### سير المصادقة الحالي
```
مستخدم جديد
  → تسجيل دخول OAuth (/login)
  → إكمال البيانات المهنية (/register)
  → انتظار موافقة المدير (/approve)
  → وصول كامل للنظام (AppShell)

المدير
  → يرى طلبات التسجيل في /users
  → موافقة أو رفض فورية
  → إشعار تلقائي عند وصول طلب جديد
```
