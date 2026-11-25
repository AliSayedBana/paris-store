const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'store_settings.json');

const DEFAULT_SETTINGS = {
  whatsappNumber: '201065968425',
  whatsappDisplay: '01065968425',
  announcementText: '',
  activeCouponBannerCode: '',
  coupons: [],
  shipping: {
    freeThreshold: 500,
    vipThreshold: 5000,
    cairoFee: 60,
    deltaFee: 75,
    otherFee: 95
  },
  installments: {
    enabled: false,
    minPrice: 1000,
    months: 12
  },
  pixels: {
    metaPixelId: '',
    tiktokPixelId: '',
    gaMeasurementId: ''
  }
};

function getStoreSettings() {
  let saved = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading store_settings.json:', e);
    }
  }

  return {
    whatsappNumber: String(saved.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber).replace(/[^\d]/g, '') || DEFAULT_SETTINGS.whatsappNumber,
    whatsappDisplay: String(saved.whatsappDisplay || DEFAULT_SETTINGS.whatsappDisplay),
    announcementText: String(saved.announcementText !== undefined ? saved.announcementText : DEFAULT_SETTINGS.announcementText),
    activeCouponBannerCode: String(saved.activeCouponBannerCode !== undefined ? saved.activeCouponBannerCode : DEFAULT_SETTINGS.activeCouponBannerCode).trim().toUpperCase(),
    coupons: Array.isArray(saved.coupons) ? saved.coupons.map(c => ({
      code: String(c.code || '').trim().toUpperCase(),
      rate: Math.max(1, Math.min(90, Number(c.rate) || 10)),
      label: String(c.label || `خصم ${Number(c.rate) || 10}%`),
      active: c.active !== false
    })).filter(c => c.code) : JSON.parse(JSON.stringify(DEFAULT_SETTINGS.coupons)),
    shipping: {
      ...DEFAULT_SETTINGS.shipping,
      ...(saved.shipping || {})
    },
    installments: {
      ...DEFAULT_SETTINGS.installments,
      ...(saved.installments || {})
    },
    pixels: {
      ...DEFAULT_SETTINGS.pixels,
      ...(saved.pixels || {})
    }
  };
}

function saveStoreSettings(input) {
  const current = getStoreSettings();
  const merged = {
    whatsappNumber: String(input.whatsappNumber || current.whatsappNumber).replace(/[^\d]/g, '') || current.whatsappNumber,
    whatsappDisplay: String(input.whatsappDisplay || input.whatsappNumber || current.whatsappDisplay).trim(),
    announcementText: String(input.announcementText !== undefined ? input.announcementText : current.announcementText).trim(),
    activeCouponBannerCode: String(input.activeCouponBannerCode !== undefined ? input.activeCouponBannerCode : current.activeCouponBannerCode).trim().toUpperCase(),
    coupons: Array.isArray(input.coupons) ? input.coupons.map(c => ({
      code: String(c.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
      rate: Math.max(1, Math.min(90, Number(c.rate) || 10)),
      label: String(c.label || `خصم ${Number(c.rate) || 10}%`).trim(),
      active: c.active !== false
    })).filter(c => c.code) : current.coupons,
    shipping: {
      freeThreshold: Math.max(0, Number(input.shipping && input.shipping.freeThreshold !== undefined ? input.shipping.freeThreshold : current.shipping.freeThreshold)),
      vipThreshold: Math.max(0, Number(input.shipping && input.shipping.vipThreshold !== undefined ? input.shipping.vipThreshold : current.shipping.vipThreshold)),
      cairoFee: Math.max(0, Number(input.shipping && input.shipping.cairoFee !== undefined ? input.shipping.cairoFee : current.shipping.cairoFee)),
      deltaFee: Math.max(0, Number(input.shipping && input.shipping.deltaFee !== undefined ? input.shipping.deltaFee : current.shipping.deltaFee)),
      otherFee: Math.max(0, Number(input.shipping && input.shipping.otherFee !== undefined ? input.shipping.otherFee : current.shipping.otherFee))
    },
    installments: {
      enabled: (input.installments && input.installments.enabled !== undefined) ? Boolean(input.installments.enabled) : current.installments.enabled,
      minPrice: Math.max(100, Number(input.installments && input.installments.minPrice !== undefined ? input.installments.minPrice : current.installments.minPrice)),
      months: Math.max(2, Math.min(60, Number(input.installments && input.installments.months !== undefined ? input.installments.months : current.installments.months)))
    },
    pixels: {
      metaPixelId: String(input.pixels && input.pixels.metaPixelId !== undefined ? input.pixels.metaPixelId : current.pixels.metaPixelId).replace(/[^0-9]/g, ''),
      tiktokPixelId: String(input.pixels && input.pixels.tiktokPixelId !== undefined ? input.pixels.tiktokPixelId : current.pixels.tiktokPixelId).replace(/[^A-Za-z0-9_-]/g, ''),
      gaMeasurementId: String(input.pixels && input.pixels.gaMeasurementId !== undefined ? input.pixels.gaMeasurementId : current.pixels.gaMeasurementId).replace(/[^A-Za-z0-9_-]/g, '')
    },
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = { getStoreSettings, saveStoreSettings, SETTINGS_FILE };
