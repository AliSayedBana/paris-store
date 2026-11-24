const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildStore } = require('./build_store');
const auth = require('./auth_utils');

const PORT = 4000;
const BASE_DIR = __dirname;
const PRODUCTS_FILE = path.join(BASE_DIR, 'products.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.md': 'text/plain; charset=utf-8',
  '.php': 'text/plain; charset=utf-8',
  '.csv': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading JSON:', file, e);
  }
  return fallback;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(body);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  const method = req.method.toUpperCase();

  // No-cache headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // ===================== AUTH & SESSION API ROUTES =====================

  // POST /api/auth/login or /api/admin/login
  if ((reqPath === '/api/auth/login' || reqPath === '/api/admin/login') && method === 'POST') {
    const data = await parseBody(req);
    const emailInput = (data.email || '').trim();
    const passwordInput = data.password || '';
    const rememberMe = Boolean(data.rememberMe !== false);

    const admin = auth.findAdminByEmail(emailInput);

    if (admin && auth.verifyAdminPassword(admin, passwordInput)) {
      const session = auth.createSession(admin, rememberMe);
      const maxAge = rememberMe ? 14 * 24 * 3600 : 24 * 3600;
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `paris_auth_token=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
      });
      res.end(JSON.stringify({
        ok: true,
        token: session.token,
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.name,
        role: admin.role,
        mall: admin.mall,
        departmentName: admin.departmentName
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        message: 'البريد الإلكتروني أو الرقم السري غير صحيح. يرجى التأكد وإعادة المحاولة.'
      }));
    }
    return;
  }

  // POST /api/auth/logout or /api/admin/logout
  if ((reqPath === '/api/auth/logout' || reqPath === '/api/admin/logout') && method === 'POST') {
    const cookies = auth.parseCookies(req);
    const token = cookies['paris_auth_token'] || (req.headers && req.headers['x-auth-token']);
    if (token) {
      auth.destroySession(token);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'paris_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GET /api/admin/check-auth
  if (reqPath === '/api/admin/check-auth' && method === 'GET') {
    const session = auth.verifySession(req);
    if (session) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        authenticated: true,
        adminId: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
        mall: session.mall,
        departmentName: session.departmentName
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        authenticated: false,
        message: 'غير مسجل الدخول'
      }));
    }
    return;
  }

  // GET /api/admin/config
  if (reqPath === '/api/admin/config' && method === 'GET') {
    const session = auth.verifySession(req);
    const config = auth.getAdminConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      adminEmail: (session && session.email) || config.adminEmail,
      adminName: (session && session.name) || config.adminName,
      admins: auth.getAdminsPublicList()
    }));
    return;
  }

  // GET /api/admin/studio-images
  if (reqPath === '/api/admin/studio-images' && method === 'GET') {
    const uploadDir = path.join(BASE_DIR, 'uploads', 'paris-custom');
    let images = [];
    if (fs.existsSync(uploadDir)) {
      images = fs.readdirSync(uploadDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.includes('-100x100') && !f.includes('-50x50') && !f.includes('-150x150'))
        .map(f => `/uploads/paris-custom/${f}`);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(images));
    return;
  }

  // POST /api/admin/upload-image (Upload image from user's device directly)
  if (reqPath === '/api/admin/upload-image' && method === 'POST') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'غير مصرح لك، يرجى تسجيل الدخول أولاً' }));
      return;
    }

    try {
      const data = await parseBody(req);
      const fileData = data.data || data.image || '';
      const originalName = data.name || data.filename || 'uploaded-product.jpg';

      if (!fileData || !fileData.includes('base64,')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'بيانات الصورة غير صالحة، يرجى اختيار ملف صورة صالح' }));
        return;
      }

      // Extract base64 parts
      const parts = fileData.split(';base64,');
      const base64Content = parts[1];
      const buffer = Buffer.from(base64Content, 'base64');

      // Sanitize extension
      let ext = path.extname(originalName).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)) {
        ext = '.jpg';
      }

      // Safe clean filename
      const baseClean = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_').substring(0, 30);
      const filename = `product-${Date.now()}-${baseClean}${ext}`;

      const uploadDir = path.join(BASE_DIR, 'uploads', 'paris-custom');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const destPath = path.join(uploadDir, filename);
      fs.writeFileSync(destPath, buffer);

      const publicUrl = `/uploads/paris-custom/${filename}`;
      console.log(`[Upload API] Image uploaded successfully from device: ${publicUrl} (${buffer.length} bytes)`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        imageUrl: publicUrl,
        filename: filename,
        size: buffer.length
      }));
      return;
    } catch (err) {
      console.error('[Upload Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'حدث خطأ أثناء حفظ الصورة على السيرفر' }));
      return;
    }
  }

  // POST /api/admin/change-credentials or /api/admin/change-password
  if ((reqPath === '/api/admin/change-credentials' || reqPath === '/api/admin/change-password' || reqPath === '/api/admin/config') && method === 'POST') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح: يجب تسجيل الدخول كأدمن لتعديل البيانات.' }));
      return;
    }
    const data = await parseBody(req);
    const targetAdminId = (session.role === 'super_admin' && data.adminId) ? data.adminId : session.adminId;
    const newEmail = data.adminEmail || data.email;
    const newPassword = data.adminPassword || data.newPassword || data.password;
    const newName = data.adminName || data.name;

    const updatedAdmin = auth.updateAdminCredentials(targetAdminId, newEmail, newPassword, newName);
    const newSession = auth.createSession(updatedAdmin, true);
    buildStore();

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `paris_auth_token=${newSession.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 24 * 3600}`
    });
    res.end(JSON.stringify({
      ok: true,
      token: newSession.token,
      adminEmail: updatedAdmin.email,
      adminName: updatedAdmin.name,
      role: updatedAdmin.role,
      mall: updatedAdmin.mall,
      message: 'تم تحديث بيانات الأدمن بنجاح!'
    }));
    return;
  }

  // ===================== PRODUCTS API ROUTES =====================

  // GET /api/products
  if (reqPath === '/api/products' && method === 'GET') {
    const session = auth.verifySession(req);
    let products = readJSON(PRODUCTS_FILE, []);
    
    // If admin has restricted mall scope
    if (session && session.mall && session.mall !== 'all') {
      products = products.filter(p => p.mall === session.mall);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
    return;
  }

  // POST /api/products (Add product - Protected & Amazon-style fields)
  if (reqPath === '/api/products' && method === 'POST') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح: يجب تسجيل الدخول كمدير لإضافة منتج' }));
      return;
    }
    const newProd = await parseBody(req);

    // Enforce mall role
    if (session.mall && session.mall !== 'all') {
      newProd.mall = session.mall;
    }

    const products = readJSON(PRODUCTS_FILE, []);
    const nextId = products.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
    newProd.id = nextId;
    if (newProd.published === undefined) newProd.published = true;

    // Amazon-style variations cleanup
    if (Array.isArray(newProd.sizes)) {
      newProd.sizes = newProd.sizes.filter(s => s && s.trim());
    }
    if (Array.isArray(newProd.colors)) {
      newProd.colors = newProd.colors.filter(c => c && c.trim());
    }
    if (Array.isArray(newProd.highlights)) {
      newProd.highlights = newProd.highlights.filter(h => h && h.trim());
    }

    products.push(newProd);
    writeJSON(PRODUCTS_FILE, products);
    buildStore();
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, product: newProd }));
    return;
  }

  // PUT /api/products/:id (Update product or toggle visibility - Protected)
  if (reqPath.startsWith('/api/products/') && method === 'PUT') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح: يجب تسجيل الدخول كمدير لتعديل المنتجات' }));
      return;
    }
    const id = parseInt(reqPath.replace('/api/products/', ''), 10);
    const updateData = await parseBody(req);
    const products = readJSON(PRODUCTS_FILE, []);
    const idx = products.findIndex(p => p.id === id);

    if (idx !== -1) {
      // Permission check
      if (session.mall && session.mall !== 'all' && products[idx].mall !== session.mall) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'غير مصرح: لا يمكنك تعديل منتجات قسم آخر.' }));
        return;
      }

      products[idx] = { ...products[idx], ...updateData, id };
      writeJSON(PRODUCTS_FILE, products);
      buildStore();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, product: products[idx] }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'المنتج غير موجود' }));
    }
    return;
  }

  // DELETE /api/products/:id (Delete product - Protected)
  if (reqPath.startsWith('/api/products/') && method === 'DELETE') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح: يجب تسجيل الدخول كمدير لحذف منتج' }));
      return;
    }
    const id = parseInt(reqPath.replace('/api/products/', ''), 10);
    let products = readJSON(PRODUCTS_FILE, []);
    const prod = products.find(p => p.id === id);

    if (prod) {
      if (session.mall && session.mall !== 'all' && prod.mall !== session.mall) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'غير مصرح: لا يمكنك حذف منتج يتبع قسماً آخر.' }));
        return;
      }
      products = products.filter(p => p.id !== id);
      writeJSON(PRODUCTS_FILE, products);
      buildStore();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'المنتج غير موجود' }));
    }
    return;
  }

  // POST /api/import-csv (Import CSV - Protected)
  if (reqPath === '/api/import-csv' && method === 'POST') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح: يجب تسجيل الدخول كمدير لاستيراد المنتجات' }));
      return;
    }
    const csvText = await parseBody(req);
    if (typeof csvText !== 'string' || !csvText.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'محتوى الملف فارغ أو غير صالح' }));
      return;
    }

    const rows = csvText.split('\n').filter(r => r.trim());
    if (rows.length < 2) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'الملف لا يحتوي على صفوف بيانات' }));
      return;
    }

    const products = readJSON(PRODUCTS_FILE, []);
    let maxId = products.reduce((max, p) => Math.max(max, p.id || 0), 0);
    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',');
      if (row.length >= 4) {
        const name = (row[3] || row[1] || '').replace(/"/g, '').trim();
        if (name && !name.includes('Type') && !name.includes('SKU')) {
          maxId++;
          count++;
          const price = parseInt(row[25] || row[24] || '200', 10) || 200;
          let cat = (row[26] || '').toLowerCase();
          let mall = 'clothes';
          if (cat.includes('حذاء') || cat.includes('shoes') || cat.includes('سنيكرز')) {
            mall = 'shoes';
            cat = 'shoes men';
          } else if (cat.includes('أدوات') || cat.includes('home') || cat.includes('مطبخ')) {
            mall = 'home';
            cat = 'home kitchen';
          } else {
            mall = 'clothes';
            cat = 'clothes men';
          }

          if (session.mall && session.mall !== 'all') {
            mall = session.mall;
          }

          products.push({
            id: maxId,
            title: name,
            mall: mall,
            category: cat,
            chip: mall === 'shoes' ? 'أحذية رجالي' : (mall === 'clothes' ? 'ملابس' : 'أدوات منزلية'),
            price: price,
            regularPrice: price + 50,
            discountBadge: 'جديد',
            image: row[29] || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
            sale: false,
            published: true
          });
        }
      }
    }

    writeJSON(PRODUCTS_FILE, products);
    buildStore();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, importedCount: count }));
    return;
  }

  // ===================== FRONTEND & ADMIN PAGE ROUTES =====================

  // Dedicated Login Page
  if (reqPath === '/login' || reqPath === '/login.html') {
    const session = auth.verifySession(req);
    if (session) {
      res.writeHead(302, { 'Location': '/admin' });
      res.end();
      return;
    }
    const loginPath = path.join(BASE_DIR, 'login.html');
    if (fs.existsSync(loginPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(loginPath).pipe(res);
      return;
    }
  }

  // Admin Dashboard routes (Server-Side Route Protection)
  if (reqPath === '/admin' || reqPath === '/admin.html' || reqPath === '/wp-admin' || reqPath === '/wp-admin/' || reqPath === '/wp-login.php') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }
    const adminPath = path.join(BASE_DIR, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(adminPath).pipe(res);
      return;
    }
  }

  // Storefront routes
  if (reqPath === '/' || reqPath === '/index.html' || reqPath === '/store' || reqPath === '/store.html') {
    const storePath = path.join(BASE_DIR, 'store.html');
    if (fs.existsSync(storePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(storePath).pipe(res);
      return;
    }
  }

  // Static files
  const filePath = path.join(BASE_DIR, reqPath);
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Paris Store server running on http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
  console.log(`Admin Login running on http://localhost:${PORT}/login`);
  console.log(`Admin Dashboard running on http://localhost:${PORT}/admin`);
});
