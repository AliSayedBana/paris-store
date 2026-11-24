const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/assa/.gemini/antigravity/scratch/paris-store';
const html = fs.readFileSync(path.join(basePath, 'store.html'), 'utf8');

const lines = html.split('\n');
const products = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<li class="product paris-modern-card"')) {
    const catMatch = line.match(/data-category="([^"]+)"/);
    const mallMatch = line.match(/data-mall="([^"]+)"/);
    const saleMatch = line.match(/data-sale="([^"]+)"/);
    current = {
      id: products.length + 1,
      mall: mallMatch ? mallMatch[1] : 'clothes',
      category: catMatch ? catMatch[1] : 'clothes',
      sale: saleMatch ? (saleMatch[1] === 'true') : false,
      published: true,
      title: '',
      chip: '',
      price: 0,
      regularPrice: 0,
      discountBadge: '',
      image: ''
    };
  } else if (current) {
    if (line.includes('badge-discount')) {
      const m = line.match(/<span class="badge-discount">([^<]+)<\/span>/);
      if (m) current.discountBadge = m[1];
    }
    if (line.includes('paris-card-img')) {
      const m = line.match(/src="([^"]+)"/);
      if (m) current.image = m[1];
    }
    if (line.includes('paris-category-chip')) {
      const m = line.match(/<div class="paris-category-chip">([^<]+)<\/div>/);
      if (m) current.chip = m[1];
    }
    if (line.includes('paris-card-title')) {
      const m = line.match(/<a[^>]*>([^<]+)<\/a>/);
      if (m) current.title = m[1];
    }
    if (line.includes('<ins>')) {
      const m = line.match(/<span class="woocommerce-Price-amount amount">([0-9]+)/);
      if (m) current.price = parseInt(m[1], 10);
    }
    if (line.includes('<del>')) {
      const m = line.match(/<span class="woocommerce-Price-amount amount">([0-9]+)/);
      if (m) current.regularPrice = parseInt(m[1], 10);
    }
    if (line.includes('</li>')) {
      if (!current.regularPrice) current.regularPrice = current.price;
      products.push(current);
      current = null;
    }
  }
}

console.log('Found', products.length, 'products');
fs.writeFileSync(path.join(basePath, 'products.json'), JSON.stringify(products, null, 2), 'utf8');

// Admin config
const adminConfig = {
  adminEmail: "admin@paris-store.com",
  adminName: "مدير متجر باريس",
  adminPassword: "admin",
  lastUpdated: new Date().toISOString()
};
fs.writeFileSync(path.join(basePath, 'admin_config.json'), JSON.stringify(adminConfig, null, 2), 'utf8');
console.log('Saved products.json and admin_config.json');
