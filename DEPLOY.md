# دليل نشر متجر باريس أونلاين (Production Deploy Guide)

المتجر مبني بـ **Node.js النقي** (بدون قواعد بيانات خارجية معقدة أو حزم npm ثقيلة)، ويعمل على أي VPS (مثل **Hostinger / Contabo / DigitalOcean**).

---

## 1️⃣ متطلبات السيرفر
- **Node.js 18+** (يُفضّل Node 20 LTS)
- **PM2** لإبقاء المتجر شغالاً 24 ساعة: `npm install -g pm2`
- **Nginx + Certbot** لربط الدومين وشهادة الحماية `HTTPS`

---

## 2️⃣ خطوات الرفع والتشغيل على السيرفر
```bash
# 1. استنساخ المشروع
git clone https://github.com/AliSayedBana/paris-store.git
cd paris-store

# 2. بناء صفحات المتجر
node build_store.js

# 3. التشغيل الدائم عبر PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

> للتأكد من أن السيرفر يعمل بشكل سليم، افتح:
> `http://SERVER_IP:4000/api/health`

---

## 3️⃣ ربط الدومين عبر Nginx (Reverse Proxy + HTTPS)
أنشئ ملف الموقع `/etc/nginx/sites-available/paris-store`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
ثم فعّل SSL المجاني:
```bash
sudo ln -s /etc/nginx/sites-available/paris-store /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 4️⃣ قائمة الأمان والنسخ الاحتياطي قبل إطلاق الإعلانات
1. افتح `/login` وادخل لوحة الإدارة، ثم اضغط **⚙️ حسابي** وغيّر الإيميل وكلمة المرور الافتراضية فوراً.
2. ادخل **الخصومات والإعدادات** واضبط رقم الواتساب وأسعار الشحن وأكواد البيكسل (`Meta / TikTok / GA4`).
3. لتحميل نسخة احتياطية كاملة في أي وقت (المنتجات + الطلبات + الإعدادات):
   **الإدارة -> الخصومات والإعدادات -> ⬇️ تحميل نسخة احتياطية (.json)**.
4. لا تقم برفع ملفات `orders.json` أو `admin_config.json` على مستودع عام بعد تشغيل الإعلانات لحفظ خصوصية عملائك.
