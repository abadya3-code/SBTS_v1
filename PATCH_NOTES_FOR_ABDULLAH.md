# تقرير العمل المنفذ على SBTS Professional

## الهدف

تطبيق تصليحات المرحلة الأولى لجعل التطبيق أقرب لنسخة Pilot قابلة للتشغيل والفحص، مع تحسين الأمن والصلاحيات والتوثيق.

## الملفات المعدلة

- `server/_core/env.ts`
- `server/_core/cookies.ts`
- `server/_core/index.ts`
- `server/_core/security.ts` جديد
- `server/_core/sdk.ts`
- `server/_core/trpc.ts`
- `server/routers/auth.ts`
- `server/routers/areas.ts`
- `server/routers/projects.ts`
- `server/routers/reports.ts`
- `server/routers/slipBlinds.ts`
- `server/routers/workflows.ts`
- `server/routers/access-control.ts`
- `server/db/users.ts`
- `server/db/index.ts`
- `server/db/notifications.ts`
- `drizzle/schema.ts`
- `client/src/components/layout/AppShell.tsx`
- `package.json`
- `.env.example` جديد
- `README_RUN_AR.md` جديد

## أهم التصليحات

### 1) تشغيل أكثر أماناً

أضفت `validateEnv()` بحيث:

- Production يتطلب `DATABASE_URL`.
- Production يتطلب `JWT_SECRET` بطول 32 حرف أو أكثر.
- Development يسمح بالتشغيل لكنه يعطي warning إذا كانت الإعدادات ناقصة.

### 2) حماية JWT

تم تعديل `sdk.ts` ليستخدم `getJwtSecret()` بدل الاعتماد المباشر على قيمة فارغة، وهذا يمنع تشغيل production بسر ضعيف.

### 3) Cookies أكثر أماناً

تم تعديل إعدادات session cookie:

- `httpOnly: true`
- `sameSite: lax` افتراضياً
- `sameSite: none` فقط إذا تم ضبط `COOKIE_SAME_SITE=none` وكان الاتصال HTTPS

### 4) Security Headers و Rate Limit

أضفت ملف `server/_core/security.ts` وفيه:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Resource-Policy`
- Rate limit عام على `/api/trpc`

### 5) Login Lockout

تم إضافة حماية مبدئية داخل `auth.login`:

- حساب محاولات الدخول الفاشلة لكل بريد/IP.
- استخدام `maxLoginAttempts` و `lockoutDurationMinutes` من Security Settings.
- قفل مؤقت بعد تعدد المحاولات.

هذه نسخة in-memory مناسبة كبداية Pilot. في Production كبير يفضل نقلها إلى جدول DB أو Redis.

### 6) RBAC فعلي على API

أضفت `permissionProcedure(permissionKey)` في tRPC.

تم ربط صلاحيات مهمة مثل:

- `projects.view`
- `projects.create`
- `blinds.view`
- `blinds.create`
- `blinds.edit`
- `workflow.approve`
- `workflow.configure`
- `reports.view`
- `reports.export`
- `users.view`

الأدمن ما زال يملك full override.

### 7) إرجاع صلاحيات المستخدم مع `auth.me`

أصبح `auth.me` يرجع:

```ts
access: {
  roleKeys: string[]
  permissionKeys: string[]
  menuKeys: string[]
  phaseKeys: string[]
}
```

هذا يساعد الواجهة على إخفاء القوائم غير المسموحة.

### 8) القائمة الجانبية حسب الصلاحيات

تم تعديل `AppShell.tsx` بحيث:

- Admin يرى كل القوائم.
- المستخدم يرى فقط القوائم الموجودة في `access.menuKeys`.
- Dashboard يظهر دائماً للمستخدم المسجل.

### 9) إصلاح Bug في Role Assignment

كان الكود يحاول إدخال حقل `assignedAt` في `user_role_assignments` مع أنه غير موجود في schema. تم حذفه والاعتماد على `createdAt`.

### 10) إصلاح نوع `notifications.projectId`

كان `projectId` في جدول notifications نوعه `int` بينما المشاريع تستخدم `varchar(40)`. تم توحيده إلى `varchar(40)`.

## ما لم يتم تنفيذه بعد

هذه المرحلة لم تضف بعد:

- QR field page كاملة.
- Audit Events immutable chain.
- Photo evidence.
- Docker.
- Playwright E2E.
- تحويل login attempts إلى DB/Redis.

## ملاحظة فحص

لم أتمكن من تشغيل `pnpm install` أو `pnpm test` داخل بيئة العمل هنا لأن تحميل pnpm من الإنترنت غير متاح. لذلك يجب تشغيل أوامر الفحص عندك في الجهاز بعد فك الضغط:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

تم تشغيل فحص TypeScript المتاح محلياً، لكنه توقف بسبب عدم وجود `node_modules` و type definitions، وليس بسبب Syntax في الملفات المعدلة.

---

# v1.6 UI/UX + Settings Integration

## Completed
- Rebuilt Dashboard as an English executive command center.
- Connected Dashboard hero, app identity, company identity, version, and CTA buttons to General Settings.
- Added a real global search component for projects and blinds.
- Fixed notification bell dropdown so it stays inside viewport boundaries.
- Added Appearance settings: theme selection, dark mode toggle, and font size scale.
- Connected AppShell logo, app name, company name, subtitle, and version to settings.
- Improved certificate and tag printing/export to use certificate/tag/general settings.
- Redesigned Bulk Add Blinds from Excel into a guided 3-step import dialog.
- Converted remaining Arabic user-facing pages to English: Login, Register, Approve, Notifications, User Management.

## Notes
Railway deployment remains the final build validation environment because pnpm could not be downloaded in the ChatGPT execution environment.
