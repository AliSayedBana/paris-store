const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = path.resolve(__dirname);
const CONFIG_FILE = path.join(BASE_DIR, 'admin_config.json');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function initializeDefaultAdmins() {
  const superSalt = generateSalt();
  const clothesSalt = generateSalt();
  const homeSalt = generateSalt();
  const shoesSalt = generateSalt();

  return {
    super: {
      id: 'super',
      email: 'admin@paris-store.com',
      name: 'المدير العام لمتجر باريس',
      role: 'super_admin',
      mall: 'all',
      departmentName: 'الإدارة العامة (جميع الأقسام)',
      salt: superSalt,
      passwordHash: hashPassword('paris2026', superSalt),
      lastLogin: null
    },
    clothes: {
      id: 'clothes',
      email: 'clothes-admin@paris-store.com',
      name: 'مشرف قسم الملابس والأزياء',
      role: 'clothes_admin',
      mall: 'clothes',
      departmentName: 'مول باريس للملابس',
      salt: clothesSalt,
      passwordHash: hashPassword('clothes2026', clothesSalt),
      lastLogin: null
    },
    home: {
      id: 'home',
      email: 'home-admin@paris-store.com',
      name: 'مشرف قسم الأدوات المنزلية والديكور',
      role: 'home_admin',
      mall: 'home',
      departmentName: 'مول باريس للأدوات المنزلية',
      salt: homeSalt,
      passwordHash: hashPassword('home2026', homeSalt),
      lastLogin: null
    },
    shoes: {
      id: 'shoes',
      email: 'shoes-admin@paris-store.com',
      name: 'مشرف قسم الأحذية والأحذية الرياضية',
      role: 'shoes_admin',
      mall: 'shoes',
      departmentName: 'مول باريس للأحذية',
      salt: shoesSalt,
      passwordHash: hashPassword('shoes2026', shoesSalt),
      lastLogin: null
    }
  };
}

function getAdminConfig() {
  let config = null;
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading admin_config.json:', e);
    }
  }

  if (!config) {
    config = {};
  }

  // Ensure admins object exists
  if (!config.admins || typeof config.admins !== 'object') {
    config.admins = initializeDefaultAdmins();
  } else {
    // Ensure each department admin exists
    const defaults = initializeDefaultAdmins();
    for (const key of ['super', 'clothes', 'home', 'shoes']) {
      if (!config.admins[key]) {
        config.admins[key] = defaults[key];
      }
    }
  }

  // Root level backwards compatibility
  if (!config.adminEmail) {
    config.adminEmail = config.admins.super.email;
  }
  if (!config.adminName) {
    config.adminName = config.admins.super.name;
  }
  if (!config.salt) {
    config.salt = config.admins.super.salt;
  }
  if (!config.passwordHash) {
    config.passwordHash = config.admins.super.passwordHash;
  }

  if (!config.sessions) {
    config.sessions = {};
  }

  saveAdminConfig(config);
  return config;
}

function saveAdminConfig(config) {
  config.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function findAdminByEmail(emailInput) {
  if (!emailInput) return null;
  const normalized = emailInput.trim().toLowerCase();
  const config = getAdminConfig();

  for (const key of Object.keys(config.admins)) {
    const admin = config.admins[key];
    if (admin.email.toLowerCase() === normalized) {
      return admin;
    }
  }

  // Fallback alias matches
  if (normalized === 'admin') return config.admins.super;
  if (normalized === 'clothes' || normalized === 'clothes-admin') return config.admins.clothes;
  if (normalized === 'home' || normalized === 'home-admin') return config.admins.home;
  if (normalized === 'shoes' || normalized === 'shoes-admin') return config.admins.shoes;

  return null;
}

function verifyAdminPassword(admin, password) {
  if (!admin || !password || !admin.salt || !admin.passwordHash) return false;
  const hash = hashPassword(password, admin.salt);
  try {
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(admin.passwordHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return hash === admin.passwordHash;
  }
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers && req.headers.cookie;
  if (!rc) return list;

  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const value = decodeURI(parts.join('='));
    list[name] = value;
  });
  return list;
}

function verifySession(req) {
  const cookies = parseCookies(req);
  const token = cookies['paris_auth_token'] || (req.headers && req.headers['x-auth-token']);
  if (!token) return null;

  const config = getAdminConfig();
  const session = config.sessions && config.sessions[token];
  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    delete config.sessions[token];
    saveAdminConfig(config);
    return null;
  }

  // Get current admin info
  const admin = (config.admins && config.admins[session.adminId]) || {
    id: session.adminId || 'super',
    email: session.email,
    name: session.name,
    role: session.role || 'super_admin',
    mall: session.mall || 'all',
    departmentName: session.departmentName || 'الإدارة العامة'
  };

  return {
    token,
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mall: admin.mall,
    departmentName: admin.departmentName
  };
}

function createSession(adminOrId, rememberMe = true) {
  const config = getAdminConfig();
  const token = generateToken();
  const now = new Date();
  const days = rememberMe ? 14 : 1;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  let admin = null;
  if (typeof adminOrId === 'string') {
    admin = config.admins[adminOrId] || findAdminByEmail(adminOrId) || config.admins.super;
  } else if (adminOrId && adminOrId.id) {
    admin = config.admins[adminOrId.id] || adminOrId;
  } else {
    admin = config.admins.super;
  }

  admin.lastLogin = now.toISOString();

  // Prune expired sessions on login to keep admin_config.json clean
  if (config.sessions) {
    for (const k of Object.keys(config.sessions)) {
      if (!config.sessions[k] || new Date(config.sessions[k].expiresAt) < now) {
        delete config.sessions[k];
      }
    }
  }

  config.sessions[token] = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mall: admin.mall,
    departmentName: admin.departmentName,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  saveAdminConfig(config);
  return {
    token,
    expiresAt,
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mall: admin.mall,
    departmentName: admin.departmentName
  };
}

function destroySession(token) {
  if (!token) return;
  const config = getAdminConfig();
  if (config.sessions && config.sessions[token]) {
    delete config.sessions[token];
    saveAdminConfig(config);
  }
}

function updateAdminCredentials(adminId, email, newPassword, name) {
  const config = getAdminConfig();
  const targetId = adminId || 'super';
  const admin = config.admins[targetId];
  if (!admin) return null;

  if (email && email.trim()) {
    admin.email = email.trim();
  }
  if (name && name.trim()) {
    admin.name = name.trim();
  }
  if (newPassword && newPassword.trim()) {
    const salt = generateSalt();
    admin.salt = salt;
    admin.passwordHash = hashPassword(newPassword.trim(), salt);
  }

  // Update root-level if super admin
  if (targetId === 'super') {
    config.adminEmail = admin.email;
    config.adminName = admin.name;
    config.salt = admin.salt;
    config.passwordHash = admin.passwordHash;
  }

  saveAdminConfig(config);
  return admin;
}

function getAdminsPublicList() {
  const config = getAdminConfig();
  return Object.keys(config.admins).map(key => {
    const a = config.admins[key];
    return {
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      mall: a.mall,
      departmentName: a.departmentName,
      lastLogin: a.lastLogin
    };
  });
}

module.exports = {
  hashPassword,
  generateSalt,
  generateToken,
  getAdminConfig,
  saveAdminConfig,
  findAdminByEmail,
  verifyAdminPassword,
  parseCookies,
  verifySession,
  createSession,
  destroySession,
  updateAdminCredentials,
  getAdminsPublicList
};
