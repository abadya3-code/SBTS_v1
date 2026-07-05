# Bulk Paste browser verification notes

Date: 2026-05-05

The Bulk Paste dialog is open on `/projects/PRJ-1027`. The textarea initially displays the example text as a placeholder only, so the preview correctly shows `Preview: 0 valid rows` until actual text is pasted.

A browser input attempt placed the same sample text into the DOM textarea value, but the React-controlled state did not update in the visible preview; therefore the UI still displayed `Preview: 0 valid rows`. Console inspection confirmed the DOM textarea value and placeholder both contained the tab-separated sample row:

```ts
BLD-1401\tSlip Blind\t12 in\t300#\tNormal\tP-101A\tTrain header\tUpstream flange\tYes\tYes\tReady for certificate gate
```

Next verification should use actual keyboard typing/paste behavior or adjust the UI so users have an explicit static example or a Load example button. The parser itself should parse the sample row as one valid row when `bulkText` state receives the text.

## Follow-up verification after UX fix

تم فتح صفحة المشروع `PRJ-1027` ثم فتح نافذة **Bulk paste**. ظهرت منطقة **Paste format guide** مع جدول مثال ثابت للأعمدة المطلوبة وزر **Load example**.

عند فتح النافذة كان النص السابق الموجود في صندوق اللصق لا يزال موجوداً من فحص سابق، لذلك ظهرت المعاينة `0 valid rows` لأنه لم يكن مفصولاً بعلامات Tab أو CSV. بعد الضغط على زر **Load example** تم تحميل العينة الرسمية:

```text
BLD-1401	Slip Blind	12 in	300#	Normal	P-101A	Train header	Upstream flange	Yes	Yes	Ready for certificate gate
```

بعد تحميل العينة ظهرت المعاينة بنجاح كالتالي: `Preview: 1 valid rows`، وعرضت الجدول القيم: tag `BLD-1401`، النوع `Slip Blind`، الحجم `12 in`، rate `300#`، equipment `P-101A`، وSlip gate `Foreman OK / Merged`.

## Final browser verification after equipment rename

تمت إعادة التحقق بصرياً بعد توحيد تسمية `equipment`. صفحة المشروع `PRJ-1027` فتحت بنجاح، وزر **Bulk paste** فتح النافذة. عند الضغط على **Load example** ظهرت المعاينة `Preview: 1 valid rows` مع القيم: `BLD-1401`، النوع `Slip Blind`، الحجم `12 in`، rate `300#`، equipment `P-101A`، وحالة slip gate `Foreman OK / Merged`.
