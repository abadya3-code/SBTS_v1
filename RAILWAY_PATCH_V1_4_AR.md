# SBTS v1.4 Railway Build Fix

## سبب الخطأ
فشل Build في Railway لأن `AppShell.tsx` يستورد الملف التالي:

```ts
@/components/notifications/NotificationBell
```

لكن مجلد `client/src/components/notifications` لم يكن موجوداً في النسخة السابقة.

## التصحيح المنفذ
تمت إضافة الملف:

```text
client/src/components/notifications/NotificationBell.tsx
```

ويحتوي على:
- جرس إشعارات في الشريط العلوي.
- عداد الإشعارات غير المقروءة.
- قائمة مختصرة لآخر 5 إشعارات.
- زر قراءة الكل.
- زر الانتقال إلى صفحة الإشعارات.
- ربط كامل مع tRPC procedures:
  - `notifications.unreadCount`
  - `notifications.list`
  - `notifications.markRead`
  - `notifications.markAllRead`

## طريقة تحديث GitHub
بعد فك ضغط هذه النسخة داخل مجلد المشروع الجديد:

```powershell
git add .
git commit -m "Fix Railway build missing NotificationBell component"
git push
```

بعد الـ push سيعيد Railway النشر تلقائياً.
