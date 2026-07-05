# SBTS Professional — مهام التطوير

> للاطلاع على تاريخ المشروع الكامل وجميع المراحل المنجزة، راجع [CHANGELOG.md](./CHANGELOG.md).

---

## المهام المتبقية

### الأولوية 1 — Login / Approve / Registration (مكتملة ✅)
- [x] إضافة حقول التسجيل في schema.ts (userStatus, department, specialty, employeeNumber)
- [x] تطبيق migration SQL على قاعدة البيانات
- [x] إضافة helpers في db.ts: completeUserRegistration, approveUserRegistration, rejectUserRegistration, getPendingUsers
- [x] إضافة procedures في routers.ts: pendingUsers, approveUser, rejectUser, completeRegistration
- [x] إنشاء Login.tsx — صفحة دخول OAuth خارج AppShell
- [x] إنشاء Register.tsx — نموذج إكمال البيانات المهنية
- [x] إنشاء Approve.tsx — صفحة انتظار الموافقة مع polling
- [x] تحديث AppShell.tsx — auth guard وبيانات المستخدم الحقيقية
- [x] تحديث UserManagement.tsx — قسم طلبات التسجيل المعلقة
- [x] تحديث App.tsx — routes للمسارات العامة
- [x] Vitest: 69 اختبار ناجح — TypeScript: 0 أخطاء

### الأولوية 2 — تنظيف الكود والتوثيق
- [x] إنشاء CHANGELOG.md بتاريخ المشروع الكامل
- [x] إعادة كتابة todo.md نظيفاً
- [x] الأولوية 3: تقسيم server/db.ts إلى ملفات منطقية (server/db/)
- [x] الأولوية 4: تقسيم server/routers.ts إلى ملفات منفصلة (server/routers/)
- [x] الأولوية 5: حذف ComponentShowcase.tsx (ملف تجريبي غير مستخدم في الإنتاج)
- [x] الأولوية 6: إنشاء ARCHITECTURE.md لتوثيق هيكل المشروع

### مهام مستقبلية
- [ ] Reports: ربط نظام التقارير بإعدادات الشهادة (Certificate Settings Integration)
- [x] Notifications: نظام إشعارات In-App متكامل مع polling كل 10 ثوانٍ
- [ ] Audit Logs: بناء صفحة سجل المراجعة (Audit Logs)
- [ ] Mobile: تحسين تجربة الجوال في صفحات ProjectDetail وBlindDetail

### نظام الإشعارات (In-App) ✅
- [x] إضافة جدول notifications في drizzle/schema.ts
- [x] إنشاء server/db/notifications.ts (CRUD helpers)
- [x] إنشاء server/routers/notifications.ts (tRPC procedures)
- [x] ربط الإشعارات بالأحداث المهمة (access-control وprojects)
- [x] بناء NotificationBell component في AppShell (جرس + عداد)
- [x] إنشاء صفحة Notifications.tsx (قائمة كاملة)
- [x] إضافة route /notifications في App.tsx
- [x] Vitest: 80 اختبار ناجح (13 ملف)

### نظام المصادقة المستقل (Email + Password) ✅
- [x] إضافة حقل passwordHash لجدول users في schema.ts
- [x] تطبيق migration على قاعدة البيانات
- [x] إنشاء server/db/auth.ts (hashPassword, verifyPassword, createUser)
- [x] إنشاء server/routers/auth.ts (login, logout, changePassword, register, adminCreateUser)
- [x] تحديث صفحة Login.tsx للنظام الجديد (Email + Password)
- [x] تحديث صفحة Register.tsx (self-registration مستقل)
- [x] تحديث UserManagement.tsx (إنشاء مستخدم + تغيير كلمة المرور)
- [x] إزالة Manus OAuth routes من server/_core/index.ts
- [x] تحديث AppShell وuseAuth لاستخدام النظام الجديد
- [x] Vitest: 92 اختبار ناجح (14 ملف)
- [x] إنشاء حساب المسؤول الأول (scripts/create-admin.mjs)

### System Settings Center — إعادة بناء كاملة ✅
- [x] إنشاء جدول system_settings في schema.ts + migration (+ security_settings + notification_preferences)
- [x] إنشاء server/db/settings.ts (CRUD helpers لجميع الأقسام)
- [x] إنشاء server/routers/settings.ts (tRPC procedures لجميع الأقسام)
- [x] General Settings: صورة التطبيق، شعار الشركة، الأسماء والأوصاف، اللغة، الثيمات، Hero Title/Description، الإصدار
- [x] Default Tag Settings: لون، مقاس، شعار+QR، لون وحجم الخط، ثيمات متعددة، هول تعليق، معاينة مباشرة
- [x] Certificate Settings: عنوان، شعار، توقيع، إظهار/إخفاء عناصر، تنسيق احترافي مطابق للصورة المرفقة
- [x] Security Settings: QR access، delete actions، audit trail، session behavior
- [x] Notification Settings: اختيار الأحداث التي تنشئ إشعارات
- [x] صفحة الشهادة المطبوعة (BlindCertificate.tsx) وربطها بالمشاريع + زر View Certificate في BlindDetail
- [x] Vitest: 104 اختبار ناجح (15 ملف)
- [x] ربط General Settings بـ Dashboard Hero و AppShell (اسم التطبيق/الشركة/الإصدار)
- [x] استبدال QR placeholder بمولد QR حقيقي (qrcode library)
- [x] إضافة عرض التوقيع (signatureUrl) في الشهادة
- [x] ربط Security Settings بسلوك المصادقة (session timeout, password policy)
- [x] ربط Notification Preferences بمولدات الإشعارات (createNotification/broadcastNotification)

### Reports Integration — تصدير PDF و Excel متقدم ✅
- [x] إنشاء server/db/reports.ts (getReportGlobalStats, getReportBlinds, getReportProjectSummaries, getReportAreaSummaries)
- [x] إنشاء server/routers/reports.ts (tRPC procedures: globalStats, blinds, projectSummaries, areaSummaries)
- [x] تسجيل reportsRouter في server/routers/index.ts
- [x] إنشاء صفحة Reports.tsx مع 4 تبويبات (Executive, Projects, Blinds, Areas) + فلاتر متقدمة
- [x] إنشاء ExportDialog.tsx - نافذة تصدير متقدمة (PDF, Excel, CSV, JSON)
- [x] تصدير PDF مرتبط بـ Certificate Settings (شعار، توقيع، حجم الورقة، footer)
- [x] تصدير Excel (xlsx) متعدد الأوراق (Summary + Projects + Blinds + Areas)
- [x] تصدير CSV للمشاريع والـ Blinds
- [x] تصدير JSON هيكلي لكل البيانات
- [x] إضافة route /reports في App.tsx
- [x] تحديث AppShell: Reports انتقل من secondaryNavItems إلى navItems الرئيسية
- [x] Vitest: 134 اختبار ناجح (16 ملف)

### User Profile Page — بروفايل المستخدم الاحترافي ✅
- [x] إضافة أعمدة جديدة لجدول users: bio, phone, location, linkedIn, preferredTheme, avatarKey
- [x] تطبيق migration SQL على قاعدة البيانات
- [x] إنشاء server/db/profile.ts (getProfile, updateProfile, updateAvatar)
- [x] إنشاء server/routers/profile.ts (tRPC procedures: get, update, uploadAvatar, changePassword, stats, activity)
- [x] تسجيل profileRouter في server/routers/index.ts
- [x] إنشاء صفحة UserProfile.tsx احترافية (Hero + Avatar Upload + Personal Info + Security + Theme)
- [x] إضافة route /profile في App.tsx
- [x] ربط صورة المستخدم في AppShell بـ /profile (قابلة للنقر)
- [x] ربط preferredTheme بـ ThemeProvider لحفظ الثيم لكل مستخدم
- [x] Vitest: 146 اختبار ناجح (17 ملف)
- [x] Activity Timeline: مكون ActivityTimeline.tsx مع فلترة بنوع الحدث + Load More
- [x] Activity Timeline: procedure trpc.profile.activity مبنية على blindWorkflowLogs + blindPhaseApprovals

### Slip Blinds Tracker — تتبع السليب بلايند والمسح الدوري ✅
- [x] إنشاء جدول slip_blind_surveys في schema.ts + migration
- [x] إنشاء server/db/slipBlinds.ts (getSlipBlindsStats, getSlipBlindsList, createSurvey, getSurveyHistory)
- [x] إنشاء server/routers/slipBlinds.ts (tRPC procedures: stats, list, createSurvey, surveys, exportData)
- [x] تسجيل slipBlindsRouter في server/routers/index.ts
- [x] إعادة بناء صفحة Blinds.tsx لتكون متخصصة بالكامل للـ Slip Blinds
- [x] لوحة إحصائيات: إجمالي / في الخدمة / تمت الإزالة / تم الدمج / نسب مئوية
- [x] جدول متقدم مع فلاتر (المشروع، المنطقة، الحالة، الأولوية)
- [x] نظام المسح الدوري (Survey): إنشاء مسح جديد + سجل المسوحات السابقة
- [x] تصدير PDF احترافي للسيفتي (Safety Report) مع ترويسة + توقيع
- [x] تصدير Excel متعدد الأوراق (Summary + Details + Survey History)
- [x] Vitest: 168 اختبار ناجح (18 ملف)

### Blind Detail Sheet — نافذة تفاصيل الـ Blind المنبثقة ✅
- [x] إضافة DB helper: getBlindSurveyHistory (جلب مسوحات blind معين من survey_items)
- [x] إضافة tRPC procedure: slipBlinds.blindDetail (تفاصيل + سجل + مسوحات)
- [x] إنشاء مكون BlindDetailSheet.tsx (Sheet منبثق من اليمين)
- [x] ربط النقر على أي صف في جدول Blinds بفتح النافذة
- [x] Vitest: 187 اختبار ناجح (18 ملف)
