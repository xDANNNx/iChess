# النشر المجاني على Cloudflare
بدون مزامنة سحابية: ارفع محتوى المجلد كما هو (حذف functions و schema.sql) والموقع يعمل كاملاً.

مع المزامنة السحابية (بدون حسابات، بمفتاح سري لكل مستخدم):
1. ارفع المجلد كله إلى GitHub (مع functions).
2. Cloudflare ← Workers & Pages ← Create ← Pages ← Connect to Git، واترك Build command فارغاً.
3. Storage & Databases ← D1 ← Create (اسمها chess-ai) ← Console ← الصق محتوى schema.sql ونفّذه.
4. مشروع Pages ← Settings ← Bindings ← Add ← D1 database ← الاسم DB بالضبط ← chess-ai.
5. Deployments ← Retry deployment.
استبدل YOUR-DOMAIN.pages.dev في index.html و robots.txt و sitemap.xml بدومينك.
