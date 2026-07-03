# CI/CD Setup Guide — Building the iOS App from Windows (No Mac Required)

## الفكرة العامة

المطور يكتب كود Swift/SwiftUI بأي محرر على ويندوز (VS Code + Swift extension كافي للكتابة والقراءة، من غير build محلي). كل `git push` يشغّل تلقائياً بناء حقيقي على جهاز Mac افتراضي في السحابة (مقدَّم من GitHub أو Codemagic)، ويطلع ملف `.ipa` جاهز للتوزيع عبر TestFlight.

**مهم:** بناء iOS app لازم Mac حصراً — هذا قيد من Apple نفسها (`xcodebuild` و `codesign` أدوات macOS فقط). الحل هنا ما يلغي هذا القيد، بس يخليك تستأجر "Mac" بالدقيقة بدل ما تشتري واحد.

---

## الخيار 1: GitHub Actions (لو الكود أصلاً على GitHub — وهو كذلك حسب رابط المشروع)

### المتطلبات قبل البدء
1. **حساب Apple Developer** (فردي أو شركة) — $99/سنة، مطلوب حتى للتوزيع الداخلي عبر TestFlight.
2. **شهادات التوقيع (Signing Certificate + Provisioning Profile)** — تُنشأ مرة واحدة من [developer.apple.com](https://developer.apple.com) أو تلقائياً عبر Fastlane Match (موضّح تحت).
3. إضافة الملف `.github/workflows/ios-build.yml` (مرفق) لمجلد المشروع.

### التكلفة
GitHub Actions يعطي دقائق مجانية شهرياً حسب خطتك، لكن **دقائق macOS runners تُحسب بمعدل ×10** مقارنة بدقائق Linux العادية (يعني بناء يأخذ 15 دقيقة فعلية يُخصم منه 150 دقيقة من الرصيد). للاستخدام المتقطع (بناء نسخة تجريبية كل كم يوم) هذا غالباً كافي ضمن الخطة المجانية أو تكلفة رمزية شهرياً.

### الأسرار المطلوبة (GitHub Secrets)
تُضاف من: `Repo Settings → Secrets and variables → Actions`

| اسم الـ Secret | القيمة |
|---|---|
| `APPLE_TEAM_ID` | معرّف الفريق من حساب Apple Developer |
| `MATCH_PASSWORD` | كلمة مرور تشفير شهادات Fastlane Match |
| `APP_STORE_CONNECT_API_KEY` | مفتاح API لرفع البناء لـ TestFlight تلقائياً |
| `MATCH_GIT_URL` | رابط مستودع Git خاص منفصل لتخزين الشهادات المشفّرة (Fastlane Match يديره) |

---

## الخيار 2: Codemagic (أسهل للمبتدئين، لا يحتاج إعداد يدوي لـ Fastlane)

[codemagic.io](https://codemagic.io) خدمة CI متخصصة بتطبيقات الموبايل، فيها:
- **500 دقيقة بناء مجانية شهرياً** على أجهزة Mac (كافية لعدة نسخ تجريبية شهرياً)
- واجهة تربط GitHub مباشرة، وتدير التوقيع (code signing) تلقائياً عبر ربط حساب Apple Developer من الواجهة نفسها — بدون التعامل اليدوي مع الشهادات
- ملف `codemagic.yaml` بسيط في جذر المشروع (بديل عن GitHub Actions workflow)

**التوصية:** ابدأوا بـ **Codemagic** لأنه أسرع إعداد (ساعة تقريباً مقابل نصف يوم لإعداد Fastlane Match يدوياً)، وانتقلوا لـ GitHub Actions لاحقاً لو احتجتوا تحكم أدق أو حجم بناء أكبر من الحد المجاني.

---

## خطوات الإعداد بالترتيب (لأي خيار تختاره)

1. المطور يبني مشروع Xcode (`.xcodeproj` أو `.xcworkspace`) ويرفعه على GitHub — **الكتابة والتعديل يصير على ويندوز بأي محرر نصوص**، فقط التجميع (compile) يحتاج Mac.
2. إنشاء App ID فريد في Apple Developer Portal (مثال: `com.yourrestaurant.arcodecapture`).
3. ربط حساب Apple Developer بخدمة CI المختارة (Codemagic: من الواجهة مباشرة / GitHub Actions: عبر Fastlane Match + Secrets أعلاه).
4. أول push لفرع `main` يشغّل البناء تلقائياً → يطلع `.ipa` → يُرفع تلقائياً لـ **TestFlight**.
5. الموظفين يثبّتون التطبيق عبر رابط دعوة TestFlight (يُرسل من App Store Connect لإيميلاتهم) — بدون الحاجة لـ App Store عام.

---

## ملاحظة مهمة حول الاختبار

بما إن Object Capture API **لا يعمل إطلاقاً على iOS Simulator**، خطوة `xcodebuild test` في الـ CI ستكون محدودة (تقدر تختبر منطق الشاشات والـ ViewModels بمحاكيات وهمية/Mock للـ ObjectCaptureSession، لكن الاختبار الفعلي للالتقاط والتوليد **لازم يصير يدوياً على آيفون فعلي** بعد تثبيت النسخة من TestFlight). أضف هذا كخطوة يدوية إجبارية في عملية QA، مو شي يقدر الـ CI يغطيه بالكامل.
