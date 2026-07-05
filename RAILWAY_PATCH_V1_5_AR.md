# SBTS Professional v1.5 — Railway Build Fix

## المشكلة
فشل Railway في مرحلة Vite build بسبب الاستيراد التالي:

```text
client/src/components/access-control/PermissionMatrix
```

الملف كان مستدعى من:

```text
client/src/pages/AccessControl.tsx
```

لكن مجلد `client/src/components/access-control` لم يكن يحتوي على مكون `PermissionMatrix.tsx`.

## التصحيح
تمت إضافة الملف:

```text
client/src/components/access-control/PermissionMatrix.tsx
```

## وظيفة المكون
- عرض Matrix للصلاحيات حسب كل Role.
- عرض Matrix لقوائم Sidebar حسب كل Role.
- عرض Matrix لملاك مراحل Workflow حسب كل Role.
- دعم الضغط على الخلايا لتفعيل/إلغاء الصلاحية داخل الحالة المحلية للصفحة.

## بعد التحديث
نفّذ:

```powershell
git add .
git commit -m "Fix AccessControl missing PermissionMatrix component"
git push
```

ثم راقب Railway Deploy Logs.
