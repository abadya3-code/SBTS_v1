# SBTS Professional v1.6 — UI/UX + Settings Integration Patch

## الهدف
هذه النسخة تعالج ملاحظات تجربة المستخدم بعد تجربة Railway، وتركز على:
- Dashboard احترافي مربوط بإعدادات النظام.
- Search فعلي بدل مربع شكلي.
- جرس الإشعارات داخل حدود الشاشة.
- Settings Center مرتب ومربوط بالنظام.
- Dark Mode + Themes + Font Size.
- تحسين طباعة الشهادات والتاقات وربطها بالإعدادات.
- تحسين Bulk Add Blinds from Excel.
- تحويل الواجهات المتبقية إلى الإنجليزية.

## الملفات الجديدة
- `client/src/components/common/GlobalSearch.tsx`

## الملفات المعدلة الرئيسية
- `client/src/pages/Dashboard.tsx`
- `client/src/components/layout/AppShell.tsx`
- `client/src/components/notifications/NotificationBell.tsx`
- `client/src/pages/SystemSettings.tsx`
- `client/src/contexts/ThemeContext.tsx`
- `client/src/components/theme/ThemeToggle.tsx`
- `client/src/pages/ProjectDetail.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/Approve.tsx`
- `client/src/pages/Notifications.tsx`
- `client/src/pages/UserManagement.tsx`
- `client/src/index.css`
- `package.json`

## ملاحظات تشغيل
بعد رفع النسخة إلى GitHub سيعيد Railway البناء تلقائياً. إذا لم يبدأ النشر تلقائياً، استخدم Redeploy من Railway.

## أوامر الرفع
```powershell
git add .
git commit -m "Improve SBTS UI UX settings dashboard printing and English interface"
git push
```

## ملاحظات الفحص
تم فحص وجود الاستيرادات المحلية الناقصة وعدم وجود ملفات ناقصة في المسارات الجديدة. لم يتم تشغيل `pnpm build` داخل بيئة ChatGPT لأن Corepack لم يستطع تحميل pnpm من registry. Railway هو بيئة التحقق النهائية لهذه النسخة.
