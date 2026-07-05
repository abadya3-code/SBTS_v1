# طريقة تشغيل SBTS Professional - النسخة المعدلة

## 1) المتطلبات

- Node.js 22.x
- pnpm 10.x
- MySQL أو TiDB

## 2) تجهيز المشروع

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install --frozen-lockfile
```

## 3) إعداد ملف البيئة

انسخ الملف:

```bash
cp .env.example .env
```

ثم عدّل القيم الأساسية:

```env
DATABASE_URL=mysql://user:password@localhost:3306/sbts_professional
JWT_SECRET=اكتب_سر_طويل_عشوائي_32_حرف_او_اكثر
NODE_ENV=development
PORT=3000
```

## 4) تجهيز قاعدة البيانات

```bash
pnpm db:push
```

## 5) إنشاء مستخدم Admin

إذا كان سكربت إنشاء الأدمن مستخدم عندك، شغّله بعد ضبط قاعدة البيانات:

```bash
node scripts/create-admin.mjs
```

إذا طلب السكربت بيانات، استخدم بريدك وكلمة مرور قوية.

## 6) التشغيل المحلي

```bash
pnpm dev
```

افتح المتصفح:

```text
http://localhost:3000
```

## 7) فحص الجودة قبل التسليم

```bash
pnpm check
pnpm test
pnpm build
```

أو دفعة واحدة:

```bash
pnpm verify
```

## 8) تشغيل Production

```bash
NODE_ENV=production pnpm build
NODE_ENV=production pnpm start
```

مهم: في production لن يعمل التطبيق إذا كان `JWT_SECRET` قصير أو `DATABASE_URL` غير مضبوط.

## ملاحظات مهمة

- لا ترفع ملف `.env` إلى GitHub.
- لا تستخدم كلمة مرور Admin سهلة.
- بعد أول تشغيل، راجع صفحة Access Control وعيّن roles للمستخدمين.
- المستخدم غير المصرح لن يرى القوائم غير المسموحة له في القائمة الجانبية، والـ API يمنع العمليات الحساسة من السيرفر.

---

## Railway deployment

للنشر على Railway كرابط مستقل، راجع الملف:

```text
RAILWAY_DEPLOY_AR.md
```

هذه النسخة تحتوي أيضاً على:

```text
railway.json
.env.railway.example
```
