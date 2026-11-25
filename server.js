const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildStore } = require('./build_store');
const auth = require('./auth_utils');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const BASE_DIR = path.resolve(__dirname);
const PRODUCTS_FILE = path.join(BASE_DIR, 'products.json');
const MAX_BODY_BYTES = 25 * 1024 * 1024; // 25 MB max request body (safe for high-res phone camera uploads)

// Login Brute-Force Rate Limiter (10 failed attempts per 15 min window)
const loginAttempts = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isLoginRateLimited(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > RATE_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAt > RATE_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

function buildAuthCookie(req, token, maxAgeSeconds) {
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket && req.socket.encrypted);
  const secureFlag = isHttps ? '; Secure' : '';
  return `paris_auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

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
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        aborted = true;
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(body);
      }
    });
    req.on('error', err => {
      if (!aborted) resolve({});
    });
  });
}

// Helper to communicate with local WordPress WooCommerce REST API (only active if ENABLE_WP_BRIDGE=true)
function wpRequest(endpoint, method = 'GET', data = null) {
  if (process.env.ENABLE_WP_BRIDGE !== 'true') {
    return Promise.resolve({ status: 503, error: 'WP bridge disabled' });
  }
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: process.env.WP_HOST || 'paris-store.local',
      port: parseInt(process.env.WP_PORT, 10) || 80,
      path: endpoint,
      method: method,
      timeout: 800,
      headers: {
        'Accept': 'application/json',
      }
    };
    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 504, error: 'WP bridge timeout' });
    });

    req.on('error', (err) => {
      console.warn('[WP Bridge Warning]', err.message);
      resolve({ status: 500, error: err.message });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[Server Error]', err);
    if (!res.headersSent) {
      const code = err.statusCode || 500;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: code === 413 ? 'حجم الطلب كبير جداً' : 'حدث خطأ داخلي في الخادم' }));
    }
  });
});

async function handleRequest(req, res) {
  let reqPath = '/';
  try {
    reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }
  const method = (req.method || 'GET').toUpperCase();

  // Global Security & Cache Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Health Check endpoint for hosting / reverse proxy monitors
  if (reqPath === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status: 'healthy', uptime: Math.floor(process.uptime()) }));
    return;
  }

  // robots.txt for Search Engines
  if (reqPath === '/robots.txt' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /api/\n');
    return;
  }

  // sitemap.xml for SEO
  if (reqPath === '/sitemap.xml' && method === 'GET') {
    const host = req.headers.host || `localhost:${PORT}`;
    const proto = (req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted)) ? 'https' : 'http';
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${proto}://${host}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n</urlset>`);
    return;
  }

  // Avoid noisy 404 on browser favicon requests
  if (reqPath === '/favicon.ico' && method === 'GET') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ===================== AUTH & SESSION API ROUTES =====================

  // POST /api/auth/login or /api/admin/login
  if ((reqPath === '/api/auth/login' || reqPath === '/api/admin/login') && method === 'POST') {
    const clientIp = getClientIp(req);
    if (isLoginRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        message: 'تم تجاوز الحد المسموح لمحاولات الدخول. يرجى الانتظار 15 دقيقة والمحاولة مجدداً.'
      }));
      return;
    }

    const data = await parseBody(req);
    const emailInput = (data.email || '').trim();
    const passwordInput = data.password || '';
    const rememberMe = Boolean(data.rememberMe !== false);

    const admin = auth.findAdminByEmail(emailInput);

    if (admin && auth.verifyAdminPassword(admin, passwordInput)) {
      clearFailedLogins(clientIp);
      const session = auth.createSession(admin, rememberMe);
      const maxAge = rememberMe ? 14 * 24 * 3600 : 24 * 3600;
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': buildAuthCookie(req, session.token, maxAge)
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
      recordFailedLogin(clientIp);
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

  // GET /api/admin/config (Protected)
  if (reqPath === '/api/admin/config' && method === 'GET') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح لك بالوصول' }));
      return;
    }
    const config = auth.getAdminConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      adminEmail: session.email || config.adminEmail,
      adminName: session.name || config.adminName,
      admins: session.role === 'super_admin' ? auth.getAdminsPublicList() : undefined
    }));
    return;
  }

  // GET /api/admin/studio-images (Protected)
  if (reqPath === '/api/admin/studio-images' && method === 'GET') {
    const session = auth.verifySession(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'غير مصرح لك بالوصول' }));
      return;
    }
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

      // Also copy to LocalWP directories only when local WP bridge is enabled
      if (process.env.ENABLE_WP_BRIDGE === 'true') {
        const wpUploadDirs = [
          'C:\\Users\\asasas\\Local Sites\\paris-store\\app\\public\\wp-content\\uploads\\paris-custom',
          'C:\\Users\\asasas\\Local Sites\\paris-store\\app\\public\\uploads\\paris-custom'
        ];
        for (const d of wpUploadDirs) {
          try {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
            fs.writeFileSync(path.join(d, filename), buffer);
          } catch (e) {
            console.warn('[Image Sync Warning] Could not copy to', d, e.message);
          }
        }
      }

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

    if (newPassword && String(newPassword).trim().length < 6) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.' }));
      return;
    }

    const updatedAdmin = auth.updateAdminCredentials(targetAdminId, newEmail, newPassword, newName);
    const newSession = auth.createSession(updatedAdmin, true);
    buildStore();

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': buildAuthCookie(req, newSession.token, 14 * 24 * 3600)
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
    let products = [];
    
    // Attempt live fetch from WordPress REST API
    try {
      const wpRes = await wpRequest('/wp-json/paris/v1/products', 'GET');
      if (wpRes.status === 200 && Array.isArray(wpRes.data) && wpRes.data.length > 0) {
        products = wpRes.data;
        // Keep products.json synced as offline/static cache
        writeJSON(PRODUCTS_FILE, products);
      } else {
        products = readJSON(PRODUCTS_FILE, []);
      }
    } catch (e) {
      console.warn('[WP Fetch Warning] Falling back to products.json:', e.message);
      products = readJSON(PRODUCTS_FILE, []);
    }
    
    // Only show hidden/unpublished products to authenticated admins
    if (!session) {
      products = products.filter(p => p.published !== false);
    } else if (session.mall && session.mall !== 'all') {
      products = products.filter(p => p.mall === session.mall);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
    return;
  }

  // POST /api/products (Add product - Protected & Multi-department fields)
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

    if (newProd.published === undefined) newProd.published = true;

    // Product variations cleanup
    if (Array.isArray(newProd.sizes)) {
      newProd.sizes = newProd.sizes.filter(s => s && s.trim());
    }
    if (Array.isArray(newProd.colors)) {
      newProd.colors = newProd.colors.filter(c => c && c.trim());
    }
    if (Array.isArray(newProd.highlights)) {
      newProd.highlights = newProd.highlights.filter(h => h && h.trim());
    }

    // Sync to WordPress WooCommerce REST API
    try {
      const wpRes = await wpRequest('/wp-json/paris/v1/sync-product', 'POST', newProd);
      if (wpRes.status === 200 && wpRes.data && wpRes.data.ok) {
        newProd.wp_id = wpRes.data.product_id;
        newProd.id = wpRes.data.product_id;
        console.log(`[WP Sync] Product created in WooCommerce with ID: ${newProd.id}`);
      }
    } catch (e) {
      console.error('[WP Sync Error] Failed to sync new product to WooCommerce:', e);
    }

    const products = readJSON(PRODUCTS_FILE, []);
    if (!newProd.id) {
      const nextId = products.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
      newProd.id = nextId;
    }

    products.unshift(newProd);
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
    const idx = products.findIndex(p => p.id === id || p.wp_id === id);

    if (idx !== -1) {
      // Permission check
      if (session.mall && session.mall !== 'all' && products[idx].mall !== session.mall) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'غير مصرح: لا يمكنك تعديل منتجات قسم آخر.' }));
        return;
      }

      products[idx] = { ...products[idx], ...updateData, id };

      // Sync to WordPress WooCommerce REST API
      try {
        const syncPayload = { ...products[idx], wp_id: id };
        const wpRes = await wpRequest('/wp-json/paris/v1/sync-product', 'POST', syncPayload);
        if (wpRes.status === 200) {
          console.log(`[WP Sync] Product updated in WooCommerce ID: ${id}`);
        }
      } catch (e) {
        console.error('[WP Sync Error] Failed to sync update to WooCommerce:', e);
      }

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
    const prod = products.find(p => p.id === id || p.wp_id === id);

    if (prod) {
      if (session.mall && session.mall !== 'all' && prod.mall !== session.mall) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'غير مصرح: لا يمكنك حذف منتج يتبع قسماً آخر.' }));
        return;
      }

      // Sync delete to WordPress WooCommerce REST API
      try {
        const wpRes = await wpRequest('/wp-json/paris/v1/delete-product', 'POST', { id: id });
        if (wpRes.status === 200) {
          console.log(`[WP Sync] Product deleted from WooCommerce ID: ${id}`);
        }
      } catch (e) {
        console.error('[WP Sync Error] Failed to sync delete to WooCommerce:', e);
      }

      products = products.filter(p => p.id !== id && p.wp_id !== id);
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

  // Static files (Strictly allow-listed public asset directories only — never expose config, code, DB, or .git)
  const PUBLIC_STATIC_PREFIXES = [
    '/uploads/',
    '/themes/storefront-paris-child/assets/',
    '/assets/'
  ];
  const isAllowedStatic = PUBLIC_STATIC_PREFIXES.some(prefix => reqPath.startsWith(prefix));
  const resolvedFile = path.resolve(BASE_DIR, '.' + reqPath);

  if (!isAllowedStatic || !resolvedFile.startsWith(BASE_DIR + path.sep) || /\/\./.test(reqPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  fs.stat(resolvedFile, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400'
    });
    fs.createReadStream(resolvedFile).pipe(res);
  });
}

server.listen(PORT, () => {
  console.log(`Paris Store server running on http://localhost:${PORT}/ and http://127.0.0.1:${PORT}/`);
  console.log(`Admin Login running on http://localhost:${PORT}/login`);
  console.log(`Admin Dashboard running on http://localhost:${PORT}/admin`);
});
