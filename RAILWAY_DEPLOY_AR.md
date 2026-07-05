# تشغيل SBTS على Railway كرابط مستقل جديد

هذا الملف خاص بنشر نسخة مستقلة جديدة من SBTS على GitHub وRailway بدون علاقة بأي تطبيق سابق.

## 1) إنشاء GitHub Repo جديد

اسم مقترح:

```text
sbts-professional-railway-pilot-02
```

من PowerShell داخل مجلد المشروع:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial SBTS Railway pilot deployment"
git remote add origin https://github.com/YOUR_USERNAME/sbts-professional-railway-pilot-02.git
git push -u origin main
```

إذا ظهر أن remote موجود من مشروع سابق:

```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/sbts-professional-railway-pilot-02.git
git push -u origin main
```

## 2) إنشاء مشروع Railway مستقل

1. افتح Railway.
2. New Project.
3. Deploy from GitHub repo.
4. اختر repo الجديد فقط.
5. لا تختار المشروع القديم ولا تستخدم نفس service القديم.

## 3) إضافة MySQL مستقل داخل نفس مشروع Railway

1. داخل Project Canvas اضغط + New.
2. اختر Database → MySQL.
3. انتظر حتى يعمل MySQL.

## 4) متغيرات App Service في Railway

في خدمة التطبيق وليس خدمة MySQL، افتح Variables ثم Raw Editor وأضف:

```env
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=ضع_هنا_سر_طويل_عشوائي_اكثر_من_32_حرف
NODE_ENV=production
VITE_APP_ID=sbts-railway-pilot-02
```

ملاحظة: إذا كان اسم خدمة MySQL مختلفاً، اكتب نفس الاسم الموجود عندك في Railway. مثال:

```env
DATABASE_URL=${{mysql.MYSQL_URL}}
```

أو استخدم Add Reference Variable من Railway حتى تختار MYSQL_URL مباشرة.

## 5) أوامر Railway

الملف `railway.json` يحدد:

- Build Command: تثبيت pnpm ثم build.
- Pre-Deploy Command: تشغيل migrations عبر `pnpm db:push`.
- Start Command: `pnpm start`.

إذا احتجت تضبطها من واجهة Railway يدوياً:

Build Command:

```bash
corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile && pnpm build
```

Pre-deploy Command:

```bash
pnpm db:push
```

Start Command:

```bash
pnpm start
```

## 6) توليد رابط جديد

بعد نجاح deploy:

1. افتح خدمة التطبيق.
2. Settings.
3. Networking.
4. Generate Domain.

سيظهر لك رابط جديد مستقل مثل:

```text
https://sbts-professional-railway-pilot-02.up.railway.app
```

## 7) ملاحظات مهمة

- لا تستخدم نفس GitHub repo القديم إذا تريد تطبيقين منفصلين.
- لا تستخدم نفس Railway Project القديم.
- لا تستخدم نفس MySQL القديم.
- كل نسخة يكون لها GitHub repo مستقل + Railway Project مستقل + MySQL مستقل.
- لا ترفع ملف `.env` إلى GitHub أبداً.
