# Visual Verification — Blind Improvements

تم فتح صفحة المشروع PRJ-1027 والتحقق من ظهور أزرار العمليات الأساسية: Add blind، Bulk paste، Export certificates، Export tags، Print certificates، Print tags، وSettings.

عند فتح نافذة Add Blind ظهرت الحقول الجديدة المطلوبة: Blind type كقائمة اختيار وتظهر حالياً Slip Blind، Size بجانب Rate، وEquipment بدلاً من Line. لم تظهر حقول Phase أو Owner داخل نموذج الإضافة، وهذا يطابق المتطلب بأن المرحلة خطوات داخل كل Blind وأن المالك يأتي من إعدادات المشروع. عند اختيار Slip Blind تظهر منطقة Slip Blind certificate gate وبداخلها موافقة Forman metal واعتماد أن الـ Slip blind تم دمجه وجاهز لإصدار الشهادة.

ملاحظة تشغيلية: لا تزال بعض بيانات الـ seed القديمة في الجدول تعرض أنواعاً قديمة مثل Spectacle Blind/Spade/Spacer لأن هذه سجلات تجريبية موجودة مسبقاً، بينما نموذج الإضافة الجديد يقيد الإدخالات الجديدة على Slip Blind وDrop Spool وIsolation.

عند فتح نافذة Bulk Paste ظهرت التعليمات بالترتيب الجديد للأعمدة دون Phase أو Owner: Tag, Type, Size, Rate, Priority, Equipment, Location, Isolation Point, Foreman Metal Approved, Slip Blind Merged, Notes. ظهرت منطقة اللصق وزر Import rows. لوحظ أن العينة الافتراضية داخل النافذة تعرض Preview: 0 valid rows، لذلك يجب تصحيح عينة/محلل الإدخال الجماعي قبل التسليم حتى تكون تجربة اللصق من Excel واضحة وتعرض صفاً صالحاً عند وجود أعمدة مفصولة بتبويبات.
