const fs = require('fs');
const path = require('path');

const basePath = __dirname;

function buildStore() {
  const productsPath = path.join(basePath, 'products.json');
  let products = [];
  if (fs.existsSync(productsPath)) {
    try {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    } catch (e) {
      console.error('Error reading products.json:', e);
    }
  }

  // Admin config for email display
  let adminConfig = { adminEmail: 'admin@paris-store.com' };
  const configPath = path.join(basePath, 'admin_config.json');
  if (fs.existsSync(configPath)) {
    try {
      adminConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }

  // Filter only published products
  const publishedProducts = products.filter(p => p.published !== false);

  // Generate cards HTML with world-class luxury design
  let cardsHtml = '';
  publishedProducts.forEach(p => {
    let parentLabel = 'الأدوات المنزلية';
    let parentIcon = '🏠';
    if (p.mall === 'clothes') { parentLabel = 'الأزياء والملابس'; parentIcon = '👗'; }
    if (p.mall === 'shoes') { parentLabel = 'الأحذية والرياضة'; parentIcon = '👟'; }

    const saleStr = p.sale ? 'true' : 'false';
    const discountAmount = (p.regularPrice && p.regularPrice > p.price) ? (p.regularPrice - p.price) : 0;
    
    // Price display
    const priceDisplay = `
      <div class="paris-card-price-row">
        <span class="price-current">${p.price} <span class="curr">ج.م</span></span>
        ${p.regularPrice && p.regularPrice > p.price ? `<span class="price-old">${p.regularPrice} ج.م</span>` : ''}
        ${discountAmount > 0 ? `<span class="price-save">وفّر ${discountAmount} ج.م</span>` : ''}
      </div>
    `;

    // Sizes Chips
    const sizesHtml = (p.sizes && p.sizes.length)
      ? `<div class="paris-card-sizes-bar">
          <span class="sizes-label">المقاسات:</span>
          <div class="sizes-chips-list">
            ${p.sizes.slice(0, 5).map(s => `<span class="size-pill">${s}</span>`).join('')}
            ${p.sizes.length > 5 ? `<span class="size-pill size-more">+${p.sizes.length - 5}</span>` : ''}
          </div>
        </div>`
      : '';

    // Colors Dots Preview
    const colorsList = (p.colors && p.colors.length) ? p.colors : ['أسود', 'كحلي', 'أبيض'];
    const colorMap = {
      'أسود': '#1a1a1a', 'أبيض': '#f5f5f5', 'كحلي': '#1a2b49', 'رمادي': '#888888',
      'بني': '#6e4726', 'بيج': '#d8c29d', 'أزرق': '#2563eb', 'أحمر': '#dc2626',
      'زيتي': '#4a5d3f', 'وردي': '#f472b6', 'هافان': '#c06b3e', 'أخضر': '#16a34a'
    };
    const colorsHtml = `
      <div class="paris-card-colors-row" title="الألوان المتوفرة: ${colorsList.join('، ')}">
        ${colorsList.slice(0, 4).map(c => `<span class="color-dot" style="background:${colorMap[c] || '#444'};" title="${c}"></span>`).join('')}
        ${colorsList.length > 4 ? `<span class="color-more">+${colorsList.length - 4}</span>` : ''}
      </div>
    `;

    // Badges
    const badgePromo = p.badge 
      ? `<span class="badge-promo-highlight">${p.badge}</span>` 
      : '<span class="badge-featured">⭐ مميز</span>';

    const safeTitle = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeImg = p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

    cardsHtml += `
      <!-- Product Card #${p.id} -->
      <li class="product paris-modern-card" 
          data-category="${p.category}" 
          data-mall="${p.mall}" 
          data-sale="${saleStr}" 
          data-id="${p.id}" 
          data-price="${p.price}" 
          data-rating="4.9">
        <div class="paris-card-inner">
          
          <!-- Image Container with Hover Actions -->
          <div class="paris-card-img-container">
            <!-- Badges Bar -->
            <div class="card-badges-header">
              <div class="badges-right">
                ${p.discountBadge ? `<span class="badge-luxury-discount">${p.discountBadge}</span>` : ''}
                ${badgePromo}
              </div>
              <div class="card-dept-tag">
                <span>${parentIcon} ${parentLabel}</span>
              </div>
            </div>

            <!-- Main Product Image -->
            <a href="javascript:void(0)" onclick="openQuickView(${p.id})" class="card-img-anchor" aria-label="${safeTitle}">
              <img src="${safeImg}" alt="${p.title}" class="card-img-element" loading="lazy">
            </a>

            <!-- Quick Action Floating Overlay -->
            <div class="card-hover-actions">
              <button type="button" class="action-btn action-quickview" onclick="openQuickView(${p.id})" title="معاينة سريعة">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>معاينة سريعة</span>
              </button>
              <button type="button" class="action-btn action-wishlist" onclick="toggleWishlist(this, '${safeTitle}')" title="أضف للمفضلة">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>
          </div>

          <!-- Product Body -->
          <div class="paris-card-content">
            <div class="card-category-strip">
              <span class="category-chip-label">${p.chip || p.category}</span>
              ${colorsHtml}
            </div>

            <h3 class="card-product-title">
              <a href="javascript:void(0)" onclick="openQuickView(${p.id})" title="${safeTitle}">${p.title}</a>
            </h3>

            <!-- Rating & Trust -->
            <div class="card-rating-strip">
              <div class="stars-gold">★★★★★</div>
              <span class="rating-num">4.9</span>
              <span class="rating-count">(140+ تقييم)</span>
            </div>

            <!-- Sizes Bar -->
            ${sizesHtml}

            <!-- Price & Savings -->
            ${priceDisplay}

            <!-- Dual Action Buttons -->
            <div class="card-action-buttons-group">
              <button type="button" class="btn-card-add-cart" onclick="addToCart('${safeTitle}', ${p.price}, '${safeImg}', '${(p.sizes && p.sizes[0]) || ''}')">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>أضف للسلة</span>
              </button>

              <button type="button" class="btn-card-whatsapp-quick" onclick="quickOrderWhatsApp('${safeTitle}', ${p.price})" title="طلب سريع عبر واتساب">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-1.118-.056-.277-.088-.636-.217-1.096-.416-1.936-.838-3.195-2.798-3.292-2.927-.098-.129-.785-1.045-.785-1.993 0-.948.497-1.414.674-1.606.177-.193.385-.241.513-.241.129 0 .257.002.369.006.118.005.276-.045.432.329.16.386.546 1.332.594 1.43.048.097.08.21.016.339-.064.13-.097.21-.193.322-.096.113-.203.252-.29.339-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.33.736.655 1.357.858 1.55.954.193.096.305.08.418-.049.112-.128.481-.561.61-.754.128-.193.257-.161.433-.096.177.064 1.123.53 1.316.626.193.097.321.145.369.226.048.08.048.466-.096.871z"/></svg>
                <span>طلب واتساب</span>
              </button>
            </div>

          </div>
        </div>
      </li>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>متجر باريس | Paris Store — أفخم مول تجاري للتسوق الإلكتروني</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/themes/storefront-paris-child/assets/css/paris-store.css">
  
  <style>
    /* ============================================================
       MASTER LUXURY PARIS DESIGN SYSTEM v4.0 (World-Class Overhaul)
       ============================================================ */
    :root {
      --paris-forest: #0f3322;
      --paris-forest-dark: #071c12;
      --paris-forest-light: #164630;
      --paris-gold: #c59b27;
      --paris-gold-bright: #d4af37;
      --paris-gold-light: #fef7e0;
      --paris-coral: #eb6b47;
      --paris-coral-hover: #d35735;
      --paris-cream: #faf8f5;
      --paris-surface: #ffffff;
      --paris-border: #e8e3d8;
      --paris-text-main: #19201d;
      --paris-text-muted: #5e6b64;
      --paris-radius-lg: 22px;
      --paris-radius-md: 14px;
      --paris-radius-sm: 8px;
      --paris-shadow-sm: 0 4px 15px rgba(15, 51, 34, 0.05);
      --paris-shadow-md: 0 10px 30px rgba(15, 51, 34, 0.08);
      --paris-shadow-lg: 0 20px 50px rgba(15, 51, 34, 0.14);
      --transition-smooth: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      background: var(--paris-cream) !important;
      color: var(--paris-text-main) !important;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Override old CSS display rules */
    li.product.paris-modern-card.is-hidden,
    .paris-products-section ul.products li.product.is-hidden {
      display: none !important;
    }
    li.product.paris-modern-card:not(.is-hidden),
    .paris-products-section ul.products li.product:not(.is-hidden) {
      display: flex !important;
    }

    /* ===================== 1. TOP ANNOUNCEMENT TICKER ===================== */
    .paris-top-bar {
      background: linear-gradient(90deg, #091e14 0%, #113825 50%, #091e14 100%) !important;
      color: #fef9ec !important;
      padding: 10px 0 !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      border-bottom: 1px solid rgba(212, 175, 55, 0.25);
    }
    .paris-top-bar-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .top-promo-pill {
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid rgba(212, 175, 55, 0.5);
      color: #ffd875;
      padding: 2px 10px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 800;
      margin-inline-start: 10px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .top-promo-pill:hover {
      background: #ffd875;
      color: #0f3322;
    }
    .top-vip-support {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #e5efe9;
      text-decoration: none;
      font-size: 13px;
      transition: var(--transition-smooth);
    }
    .top-vip-support:hover { color: #ffd875; }
    .live-dot {
      width: 8px;
      height: 8px;
      background: #25d366;
      border-radius: 50%;
      box-shadow: 0 0 8px #25d366;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    /* ===================== 2. MAIN HEADER (Ultra-Luxury) ===================== */
    .paris-header {
      background: rgba(255, 255, 255, 0.96) !important;
      backdrop-filter: blur(14px) !important;
      border-bottom: 1px solid var(--paris-border) !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 1000 !important;
      box-shadow: 0 4px 25px rgba(15, 51, 34, 0.05) !important;
      padding: 14px 0 !important;
    }
    .paris-header-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    /* Brand Logo */
    .paris-brand-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
    }
    .paris-brand-crest {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0f3322 0%, #1b5338 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 18px rgba(15, 51, 34, 0.25);
      border: 1.5px solid var(--paris-gold);
    }
    .paris-brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 900;
      color: var(--paris-forest);
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 11.5px;
      color: var(--paris-gold);
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Modern Search Bar */
    .paris-search-bar {
      flex: 1;
      max-width: 580px;
      background: #f4f1ea;
      border: 1.5px solid #ded7c8;
      border-radius: 50px;
      display: flex;
      align-items: center;
      padding: 4px 8px 4px 18px;
      transition: var(--transition-smooth);
    }
    .paris-search-bar:focus-within {
      background: #ffffff;
      border-color: var(--paris-forest);
      box-shadow: 0 4px 20px rgba(15, 51, 34, 0.12);
    }
    .paris-search-scope {
      background: transparent;
      border: none;
      border-left: 1.5px solid #ded7c8;
      padding: 8px 12px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: var(--paris-forest);
      cursor: pointer;
      outline: none;
    }
    .paris-search-input {
      flex: 1;
      background: transparent;
      border: none;
      padding: 9px 14px;
      font-family: inherit;
      font-size: 14px;
      color: var(--paris-text-main);
      outline: none;
    }
    .paris-search-btn {
      background: var(--paris-forest);
      color: #fff;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .paris-search-btn:hover {
      background: var(--paris-gold);
      transform: scale(1.05);
    }

    /* Header Actions */
    .paris-header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .paris-admin-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f4f1ea;
      border: 1.5px solid #ded7c8;
      color: var(--paris-forest);
      padding: 10px 18px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 700;
      transition: var(--transition-smooth);
    }
    .paris-admin-pill-btn:hover {
      background: var(--paris-forest);
      color: #fff;
      border-color: var(--paris-forest);
    }
    .paris-cart-luxury-btn {
      background: linear-gradient(135deg, var(--paris-coral) 0%, #fa7268 100%);
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 50px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(235, 107, 71, 0.35);
      transition: var(--transition-smooth);
    }
    .paris-cart-luxury-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(235, 107, 71, 0.45);
    }
    .cart-badge-count {
      background: #ffffff;
      color: var(--paris-coral);
      font-size: 12px;
      font-weight: 900;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ===================== 3. GRAND TRIPLE-MALL SWITCHER ===================== */
    .paris-malls-nav-wrap {
      background: #ffffff;
      border-bottom: 1px solid var(--paris-border);
      padding: 16px 0 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
    .paris-malls-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 24px;
    }
    .malls-segmented-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: #f1ede4;
      padding: 6px;
      border-radius: 50px;
      max-width: 820px;
      margin: 0 auto 16px;
    }
    .mall-tab-item {
      flex: 1;
      background: transparent;
      border: none;
      padding: 12px 18px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 800;
      color: var(--paris-text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: var(--transition-smooth);
    }
    .mall-tab-item:hover {
      color: var(--paris-forest);
      background: rgba(255, 255, 255, 0.6);
    }
    .mall-tab-item.active {
      background: linear-gradient(135deg, var(--paris-forest) 0%, #1a5137 100%) !important;
      color: #ffffff !important;
      box-shadow: 0 6px 20px rgba(15, 51, 34, 0.25);
    }
    .mall-tab-count {
      font-size: 11px;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 8px;
      border-radius: 50px;
    }
    .mall-tab-item:not(.active) .mall-tab-count {
      background: #ded7c8;
      color: var(--paris-forest);
    }

    /* Sub-nav Links Bar */
    .subnav-links-track {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .subnav-links-track.active {
      display: flex;
      animation: fadeIn 0.3s ease;
    }
    .subnav-chip-link {
      padding: 8px 18px;
      background: #fbf9f4;
      border: 1.5px solid var(--paris-border);
      border-radius: 50px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--paris-forest);
      text-decoration: none;
      transition: var(--transition-smooth);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .subnav-chip-link:hover {
      border-color: var(--paris-forest);
      background: #fff;
    }
    .subnav-chip-link.active {
      background: var(--paris-forest);
      border-color: var(--paris-forest);
      color: #fff;
      box-shadow: 0 4px 15px rgba(15, 51, 34, 0.2);
    }
    .subnav-chip-link.subnav-discount {
      color: var(--paris-coral);
      border-color: rgba(235, 107, 71, 0.3);
      background: #fff6f3;
    }
    .subnav-chip-link.subnav-discount.active {
      background: var(--paris-coral);
      color: #fff;
    }

    /* ===================== 4. BENTO HERO SECTION ===================== */
    .paris-hero-container {
      max-width: 1320px;
      margin: 28px auto 0;
      padding: 0 24px;
    }
    .bento-hero-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 24px;
      min-height: 440px;
    }
    @media (max-width: 991px) {
      .bento-hero-grid { grid-template-columns: 1fr; }
    }
    .bento-text-card {
      background: linear-gradient(135deg, #ffffff 0%, #fbf9f4 100%);
      border: 1.5px solid var(--paris-border);
      border-radius: var(--paris-radius-lg);
      padding: 44px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
      box-shadow: var(--paris-shadow-md);
    }
    .bento-text-card::before {
      content: '';
      position: absolute;
      top: -60px;
      left: -60px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--paris-gold-light);
      border: 1px solid var(--paris-gold);
      color: #8c6a0c;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 20px;
      align-self: flex-start;
    }
    .hero-main-heading {
      font-size: 2.7rem;
      font-weight: 900;
      color: var(--paris-forest);
      line-height: 1.25;
      margin: 0 0 16px;
    }
    .hero-main-heading .gold-text {
      color: var(--paris-gold);
      position: relative;
    }
    .hero-sub-text {
      font-size: 1.08rem;
      line-height: 1.8;
      color: var(--paris-text-muted);
      margin: 0 0 28px;
      max-width: 520px;
    }
    .hero-action-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .btn-hero-primary {
      background: linear-gradient(135deg, var(--paris-forest) 0%, #164630 100%);
      color: #fff;
      border: none;
      padding: 15px 34px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 25px rgba(15, 51, 34, 0.3);
      transition: var(--transition-smooth);
      text-decoration: none;
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(15, 51, 34, 0.4);
    }
    .btn-hero-secondary {
      background: #ffffff;
      border: 1.5px solid var(--paris-border);
      color: var(--paris-forest);
      padding: 14px 28px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition-smooth);
      text-decoration: none;
    }
    .btn-hero-secondary:hover {
      border-color: var(--paris-forest);
      background: #f8f6f0;
    }

    /* Bento Image Card */
    .bento-image-card {
      border-radius: var(--paris-radius-lg);
      overflow: hidden;
      position: relative;
      box-shadow: var(--paris-shadow-md);
      border: 1.5px solid var(--paris-border);
      min-height: 380px;
    }
    .bento-hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bento-image-card:hover .bento-hero-img {
      transform: scale(1.04);
    }
    .hero-floating-glass-card {
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255, 255, 255, 0.8);
      border-radius: var(--paris-radius-md);
      padding: 16px 22px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .floating-crest-icon { font-size: 26px; }
    .floating-card-title {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--paris-forest);
      margin-bottom: 2px;
    }
    .floating-card-sub {
      font-size: 12px;
      color: var(--paris-gold);
      font-weight: 700;
    }

    /* ===================== 5. TRUST & BENEFITS STRIP ===================== */
    .paris-trust-strip-container {
      max-width: 1320px;
      margin: 32px auto 0;
      padding: 0 24px;
    }
    .trust-strip-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
    }
    @media (max-width: 991px) {
      .trust-strip-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 575px) {
      .trust-strip-grid { grid-template-columns: 1fr; }
    }
    .trust-card {
      background: #ffffff;
      border: 1.5px solid var(--paris-border);
      border-radius: var(--paris-radius-md);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--paris-shadow-sm);
      transition: var(--transition-smooth);
    }
    .trust-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--paris-shadow-md);
      border-color: var(--paris-gold);
    }
    .trust-icon-box {
      width: 48px;
      height: 48px;
      background: var(--paris-gold-light);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .trust-title {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--paris-forest);
      margin-bottom: 3px;
    }
    .trust-desc {
      font-size: 12px;
      color: var(--paris-text-muted);
      line-height: 1.4;
      margin: 0;
    }

    /* ===================== 6. PRODUCTS SECTION & CARDS ===================== */
    .paris-products-container {
      max-width: 1320px;
      margin: 45px auto 60px;
      padding: 0 24px;
    }
    .products-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      gap: 20px;
      flex-wrap: wrap;
    }
    .section-headline {
      font-size: 2.1rem;
      font-weight: 900;
      color: var(--paris-forest);
      margin: 0 0 6px;
    }
    .section-counter-badge {
      display: inline-block;
      background: var(--paris-gold-light);
      border: 1px solid var(--paris-gold);
      color: #8c6a0c;
      padding: 4px 14px;
      border-radius: 50px;
      font-size: 13.5px;
      font-weight: 800;
      margin-inline-start: 10px;
    }
    .section-subhead {
      font-size: 1.05rem;
      color: var(--paris-text-muted);
      margin: 0;
    }

    /* Filter Pills Container */
    .filter-pills-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .filter-pill-btn {
      background: #ffffff;
      border: 1.5px solid var(--paris-border);
      color: var(--paris-forest);
      padding: 9px 20px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: var(--transition-smooth);
    }
    .filter-pill-btn:hover {
      border-color: var(--paris-forest);
      background: #fbf9f4;
    }
    .filter-pill-btn.active {
      background: var(--paris-forest) !important;
      border-color: var(--paris-forest) !important;
      color: #ffffff !important;
      box-shadow: 0 6px 20px rgba(15, 51, 34, 0.25);
    }
    .pill-counter {
      background: #ded7c8;
      color: var(--paris-forest);
      font-size: 11px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 50px;
    }
    .filter-pill-btn.active .pill-counter {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    /* ===================== THE PRODUCT CARD (World-Class) ===================== */
    .paris-products-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)) !important;
      gap: 28px !important;
      list-style: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .paris-modern-card {
      background: #ffffff !important;
      border: 1.5px solid var(--paris-border) !important;
      border-radius: var(--paris-radius-lg) !important;
      overflow: hidden !important;
      transition: var(--transition-smooth) !important;
      box-shadow: var(--paris-shadow-sm) !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .paris-modern-card:hover {
      transform: translateY(-8px) !important;
      box-shadow: var(--paris-shadow-lg) !important;
      border-color: rgba(212, 175, 55, 0.5) !important;
    }
    .paris-card-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Card Image Area */
    .paris-card-img-container {
      position: relative;
      width: 100%;
      padding-top: 105%; /* 1:1.05 aspect ratio */
      overflow: hidden;
      background: #f6f3eb;
    }
    .card-img-anchor {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .card-img-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .paris-modern-card:hover .card-img-element {
      transform: scale(1.08);
    }

    /* Badges Bar on Image */
    .card-badges-header {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
      pointer-events: none;
    }
    .badges-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-luxury-discount {
      background: linear-gradient(135deg, var(--paris-coral) 0%, #fa7268 100%);
      color: #fff;
      font-size: 11.5px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 50px;
      box-shadow: 0 4px 12px rgba(235, 107, 71, 0.35);
    }
    .badge-promo-highlight {
      background: #0d5c3a;
      color: #fff;
      font-size: 11px;
      font-weight: 900;
      padding: 4px 9px;
      border-radius: 6px;
      letter-spacing: 0.3px;
    }
    .badge-featured {
      background: var(--paris-gold-bright);
      color: #0f3322;
      font-size: 11px;
      font-weight: 900;
      padding: 3px 9px;
      border-radius: 50px;
    }
    .card-dept-tag {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(8px);
      border: 1px solid var(--paris-border);
      color: var(--paris-forest);
      font-size: 11.5px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 50px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* Quick Action Hover Bar */
    .card-hover-actions {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      z-index: 3;
      opacity: 0;
      transform: translateY(12px);
      transition: var(--transition-smooth);
    }
    .paris-modern-card:hover .card-hover-actions {
      opacity: 1;
      transform: translateY(0);
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid var(--paris-border);
      color: var(--paris-forest);
      padding: 8px 14px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.12);
      transition: var(--transition-smooth);
    }
    .action-btn:hover {
      background: var(--paris-forest);
      color: #fff;
      border-color: var(--paris-forest);
    }
    .action-wishlist {
      width: 36px;
      height: 36px;
      padding: 0;
      justify-content: center;
      border-radius: 50%;
    }
    .action-wishlist.active {
      background: #ff4757;
      color: #fff;
      border-color: #ff4757;
    }

    /* Card Content */
    .paris-card-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-category-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .category-chip-label {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--paris-gold);
      background: var(--paris-gold-light);
      padding: 2px 9px;
      border-radius: 4px;
    }
    .paris-card-colors-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1.5px solid #fff;
      box-shadow: 0 0 0 1px #d0c9bd;
    }
    .color-more {
      font-size: 10px;
      font-weight: 800;
      color: var(--paris-text-muted);
    }

    .card-product-title {
      font-size: 15.5px;
      font-weight: 800;
      line-height: 1.45;
      margin: 0 0 8px;
      height: 44px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .card-product-title a {
      color: var(--paris-text-main);
      text-decoration: none;
      transition: var(--transition-smooth);
    }
    .card-product-title a:hover {
      color: var(--paris-forest);
    }

    /* Rating */
    .card-rating-strip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .stars-gold { color: #f5a623; letter-spacing: 1px; }
    .rating-num { font-weight: 800; color: var(--paris-forest); }
    .rating-count { color: var(--paris-text-muted); font-size: 11px; }

    /* Sizes Bar */
    .paris-card-sizes-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .sizes-label {
      font-size: 11px;
      color: var(--paris-text-muted);
      font-weight: 700;
    }
    .sizes-chips-list {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .size-pill {
      font-size: 11px;
      font-weight: 800;
      background: #f0ece3;
      color: var(--paris-forest);
      border: 1px solid #ded7c8;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .size-more { color: var(--paris-text-muted); }

    /* Price Row */
    .paris-card-price-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-top: auto;
      margin-bottom: 16px;
    }
    .price-current {
      font-size: 21px;
      font-weight: 900;
      color: var(--paris-forest);
    }
    .price-current .curr { font-size: 13px; font-weight: 700; }
    .price-old {
      font-size: 13.5px;
      color: #9aa39e;
      text-decoration: line-through;
    }
    .price-save {
      font-size: 11.5px;
      font-weight: 800;
      color: #107c41;
      background: #e8f5e9;
      padding: 2px 7px;
      border-radius: 4px;
    }

    /* Action Buttons Group */
    .card-action-buttons-group {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 8px;
    }
    .btn-card-add-cart {
      background: var(--paris-forest);
      color: #fff;
      border: none;
      padding: 10px 12px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: var(--transition-smooth);
    }
    .btn-card-add-cart:hover {
      background: var(--paris-forest-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(15, 51, 34, 0.25);
    }
    .btn-card-whatsapp-quick {
      background: #25d366;
      color: #fff;
      border: none;
      padding: 10px 10px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: var(--transition-smooth);
    }
    .btn-card-whatsapp-quick:hover {
      background: #1eb956;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(37, 211, 102, 0.35);
    }

    /* ===================== 7. QUICK VIEW MODAL ===================== */
    .paris-quickview-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 28, 18, 0.65);
      backdrop-filter: blur(8px);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }
    .quickview-modal-card {
      background: #ffffff;
      border-radius: var(--paris-radius-lg);
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--paris-shadow-lg);
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      border: 1.5px solid var(--paris-border);
    }
    @media (max-width: 768px) {
      .quickview-modal-card { grid-template-columns: 1fr; }
    }
    .quickview-img-box {
      background: #f7f5ef;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      position: relative;
    }
    .quickview-img-box img {
      max-width: 100%;
      max-height: 380px;
      object-fit: contain;
      border-radius: var(--paris-radius-md);
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .quickview-details-box {
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
    }
    .qv-close-btn {
      position: absolute;
      top: 18px;
      left: 18px;
      background: #f4f1ea;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--paris-text-muted);
      transition: var(--transition-smooth);
      z-index: 10;
    }
    .qv-close-btn:hover {
      background: var(--paris-forest);
      color: #fff;
    }
    .qv-dept-badge {
      font-size: 12px;
      font-weight: 800;
      color: var(--paris-gold);
      background: var(--paris-gold-light);
      padding: 3px 12px;
      border-radius: 50px;
      display: inline-block;
      margin-bottom: 10px;
      align-self: flex-start;
    }
    .qv-title {
      font-size: 22px;
      font-weight: 900;
      color: var(--paris-forest);
      line-height: 1.35;
      margin: 0 0 12px;
    }
    .qv-price-wrap {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 18px;
    }
    .qv-price-val {
      font-size: 26px;
      font-weight: 900;
      color: var(--paris-forest);
    }
    .qv-old-price {
      font-size: 16px;
      color: #9aa39e;
      text-decoration: line-through;
    }
    .qv-selector-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--paris-forest);
      margin-bottom: 8px;
    }
    .qv-chips-list {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .qv-chip {
      background: #f4f1ea;
      border: 1.5px solid #ded7c8;
      color: var(--paris-forest);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .qv-chip:hover, .qv-chip.selected {
      background: var(--paris-forest);
      color: #fff;
      border-color: var(--paris-forest);
    }
    .qv-highlights-list {
      background: #fbf9f4;
      border: 1px dashed #ded7c8;
      border-radius: var(--paris-radius-sm);
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--paris-text-muted);
    }

    /* ===================== 8. SIDE CART DRAWER ===================== */
    .paris-cart-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 28, 18, 0.5);
      backdrop-filter: blur(4px);
      z-index: 99990;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .paris-cart-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .paris-cart-panel {
      position: fixed;
      top: 0;
      right: -480px;
      left: auto;
      width: 100%;
      max-width: 440px;
      height: 100%;
      background: #ffffff;
      box-shadow: -10px 0 40px rgba(0,0,0,0.25);
      z-index: 99995;
      transform: none !important;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .paris-cart-panel.active {
      right: 0 !important;
      transform: none !important;
    }
    .cart-panel-header {
      padding: 20px 24px;
      background: var(--paris-forest);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cart-panel-title {
      font-size: 17px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cart-free-shipping-bar {
      background: #fbf9f4;
      border-bottom: 1px solid var(--paris-border);
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 700;
      color: var(--paris-forest);
    }
    .cart-progress-track {
      background: #ded7c8;
      height: 6px;
      border-radius: 50px;
      overflow: hidden;
      margin-top: 6px;
    }
    .cart-progress-fill {
      background: linear-gradient(90deg, #107c41, #25d366);
      height: 100%;
      width: 60%;
      transition: width 0.4s ease;
    }
    .cart-panel-items-box {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }
    .cart-panel-footer {
      padding: 20px 24px;
      background: #fcfbf8;
      border-top: 1.5px solid var(--paris-border);
    }

    /* Toast */
    .paris-toast {
      position: fixed;
      bottom: 90px;
      left: 30px;
      background: var(--paris-forest);
      color: #fff;
      padding: 14px 24px;
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      font-size: 14px;
      font-weight: 800;
      z-index: 100000;
      display: none;
      align-items: center;
      gap: 10px;
      border: 1.5px solid var(--paris-gold);
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- ===================== 1. ANNOUNCEMENT TICKER ===================== -->
  <div class="paris-top-bar">
    <div class="paris-top-bar-inner">
      <div style="display:flex; align-items:center;">
        <span>✨ <strong>موسم باريس 2026:</strong> عروض وخصومات كبرى تصل إلى 50% لجميع العائلة مع توصيل فوري للمنزل</span>
        <span class="top-promo-pill" onclick="copyCouponCode('PARIS2026')" title="انقر لنسخ كود الخصم">كود: PARIS2026 📋</span>
      </div>
      <div>
        <a href="https://wa.me/201065968425" target="_blank" class="top-vip-support">
          <span class="live-dot"></span>
          <span>خدمة عملاء VIP واتساب: 01065968425</span>
        </a>
      </div>
    </div>
  </div>

  <!-- ===================== 2. MAIN HEADER ===================== -->
  <header class="paris-header" role="banner">
    <div class="paris-header-inner">

      <!-- Logo & Brand -->
      <a href="/" class="paris-brand-logo">
        <div class="paris-brand-crest">
          <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
            <path d="M12 30V12C12 9.5 14 7.5 16.5 7.5C19 7.5 21 9.5 21 12V30" stroke="#d4af37" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M21 17C21 14.5 23 12.5 25.5 12.5C28 12.5 30 14.5 30 17V30" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="16.5" cy="8" r="2" fill="#ffd875"/>
          </svg>
        </div>
        <div class="paris-brand-text">
          <span class="brand-name">PARIS MALL | مول باريس</span>
          <span class="brand-tagline">أرقى الأزياء العصرية وجودة المنزل الفاخرة</span>
        </div>
      </a>

      <!-- Center Search Bar -->
      <form class="paris-search-bar" id="searchForm" onsubmit="event.preventDefault(); searchProducts();">
        <select id="searchCategory" class="paris-search-scope" onchange="onSearchScopeChange()">
          <option value="">كل الأقسام</option>
          <option value="clothes">👗 قسم الملابس</option>
          <option value="home">🏠 قسم الأدوات المنزلية</option>
          <option value="shoes">👟 قسم الأحذية</option>
        </select>
        <input type="text" id="searchInput" class="paris-search-input" placeholder="ابحث عن الملابس، الأحذية، أدوات المطبخ، الديكور..." autocomplete="off" oninput="searchProducts()">
        <button type="submit" class="paris-search-btn" aria-label="بحث">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
      </form>

      <!-- Header Actions -->
      <div class="paris-header-actions">
        <!-- Admin Dashboard -->
        <a href="/admin" class="paris-admin-pill-btn" title="لوحة التحكم">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>لوحة الإدارة</span>
        </a>

        <!-- Cart Button -->
        <button type="button" class="paris-cart-luxury-btn" id="openCartBtn" aria-label="السلة">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>السلة</span>
          <span class="cart-badge-count" id="headerCartCount">0</span>
        </button>
      </div>

    </div>
  </header>

  <!-- ===================== 3. GRAND TRIPLE-MALL SWITCHER ===================== -->
  <nav class="paris-malls-nav-wrap">
    <div class="paris-malls-inner">
      
      <!-- Segmented Mall Tabs -->
      <div class="malls-segmented-bar">
        <button type="button" class="mall-tab-item active" id="tabClothes" onclick="switchMall('clothes')">
          <span>👗</span>
          <span>مول باريس للملابس والأزياء</span>
          <span class="mall-tab-count">${publishedProducts.filter(p => p.mall === 'clothes').length}</span>
        </button>

        <button type="button" class="mall-tab-item" id="tabHome" onclick="switchMall('home')">
          <span>🏠</span>
          <span>مول الأدوات المنزلية والديكور</span>
          <span class="mall-tab-count">${publishedProducts.filter(p => p.mall === 'home').length}</span>
        </button>

        <button type="button" class="mall-tab-item" id="tabShoes" onclick="switchMall('shoes')">
          <span>👟</span>
          <span>مول باريس للأحذية والرياضة</span>
          <span class="mall-tab-count">${publishedProducts.filter(p => p.mall === 'shoes').length}</span>
        </button>
      </div>

      <!-- Sub-Navigation: Clothes -->
      <div class="subnav-links-track active" id="subnav-clothes">
        <a href="#products" class="subnav-chip-link active" data-slug="all" data-mall="clothes" onclick="applyCategory('all', 'clothes', this, 'كل تشكيلات الملابس', true)">كل الملابس</a>
        <a href="#products" class="subnav-chip-link" data-slug="men" data-mall="clothes" onclick="applyCategory('men', 'clothes', this, 'ملابس رجالية فاخرة', true)">👔 ملابس رجالي</a>
        <a href="#products" class="subnav-chip-link" data-slug="women" data-mall="clothes" onclick="applyCategory('women', 'clothes', this, 'ملابس نسائية راقية', true)">👗 ملابس حريمي</a>
        <a href="#products" class="subnav-chip-link" data-slug="kids" data-mall="clothes" onclick="applyCategory('kids', 'clothes', this, 'ملابس وأزياء أطفال', true)">👶 ملابس أطفال</a>
        <a href="#products" class="subnav-chip-link subnav-discount" data-slug="sale" data-mall="clothes" onclick="applyCategory('sale', 'clothes', this, 'تخفيضات وعروض الملابس %', true)">🏷️ تخفيضات الملابس %</a>
      </div>

      <!-- Sub-Navigation: Home -->
      <div class="subnav-links-track" id="subnav-home">
        <a href="#products" class="subnav-chip-link" data-slug="all" data-mall="home" onclick="applyCategory('all', 'home', this, 'كل الأدوات المنزلية', true)">كل الأدوات المنزلية</a>
        <a href="#products" class="subnav-chip-link" data-slug="kitchen" data-mall="home" onclick="applyCategory('kitchen', 'home', this, 'أدوات ومستلزمات المطبخ', true)">🍳 أدوات المطبخ</a>
        <a href="#products" class="subnav-chip-link" data-slug="decor" data-mall="home" onclick="applyCategory('decor', 'home', this, 'ديكورات ومقتنيات المنزل', true)">🖼️ ديكورات فاخرة</a>
        <a href="#products" class="subnav-chip-link" data-slug="textiles" data-mall="home" onclick="applyCategory('textiles', 'home', this, 'المفروشات والمناشف', true)">🛏️ مفروشات قطنية</a>
        <a href="#products" class="subnav-chip-link" data-slug="org" data-mall="home" onclick="applyCategory('org', 'home', this, 'منظمات المنزل والتخزين', true)">📦 منظمات وترتيب</a>
        <a href="#products" class="subnav-chip-link subnav-discount" data-slug="sale" data-mall="home" onclick="applyCategory('sale', 'home', this, 'تخفيضات الأدوات المنزلية %', true)">🏷️ تخفيضات الأدوات %</a>
      </div>

      <!-- Sub-Navigation: Shoes -->
      <div class="subnav-links-track" id="subnav-shoes">
        <a href="#products" class="subnav-chip-link" data-slug="all" data-mall="shoes" onclick="applyCategory('all', 'shoes', this, 'كل تشكيلات الأحذية', true)">كل الأحذية</a>
        <a href="#products" class="subnav-chip-link" data-slug="men" data-mall="shoes" onclick="applyCategory('men', 'shoes', this, 'أحذية رجالية راقية', true)">👞 أحذية رجالي كلاسيك</a>
        <a href="#products" class="subnav-chip-link" data-slug="women" data-mall="shoes" onclick="applyCategory('women', 'shoes', this, 'أحذية نسائية أنيقة', true)">👠 أحذية وسنيكرز حريمي</a>
        <a href="#products" class="subnav-chip-link" data-slug="sports" data-mall="shoes" onclick="applyCategory('sports', 'shoes', this, 'أحذية وسنيكرز رياضي', true)">👟 سنيكرز ورياضي</a>
        <a href="#products" class="subnav-chip-link" data-slug="kids" data-mall="shoes" onclick="applyCategory('kids', 'shoes', this, 'أحذية وأزياء أطفال', true)">👶 أحذية أطفال</a>
        <a href="#products" class="subnav-chip-link subnav-discount" data-slug="sale" data-mall="shoes" onclick="applyCategory('sale', 'shoes', this, 'تخفيضات الأحذية %', true)">🏷️ تخفيضات الأحذية %</a>
      </div>

    </div>
  </nav>

  <!-- ===================== 4. BENTO HERO SECTION ===================== -->
  <div class="paris-hero-container">
    <div class="bento-hero-grid">

      <!-- Text Card -->
      <div class="bento-text-card">
        <div class="hero-dept-badge" id="heroDeptBadge">
          <span>✨</span>
          <span id="heroEyebrow">تشكيلة باريس الحصرية 2026 — أرقى الموديلات لك ولعائلتك</span>
        </div>

        <h1 class="hero-main-heading" id="heroTitle">
          أناقتك اليومية..<br>
          <span class="gold-text">خيارات تليق بذوقك الرفيع</span>
        </h1>

        <p class="hero-sub-text" id="heroDesc">
          اكتشف أفخم التصاميم المنتقاة بعناية بخامات قطنية ممتازة وتوصيل فوري حتى باب منزلك مع حق المعاينة قبل الاستلام.
        </p>

        <div class="hero-action-buttons">
          <button type="button" class="btn-hero-primary" id="heroBtn" onclick="applyCategory('all', currentMall, null, (currentMall==='clothes'?'كل تشكيلات الملابس':(currentMall==='shoes'?'كل تشكيلات الأحذية':'كل الأدوات المنزلية')), true)">
            <span id="heroBtnText">تسوق التشكيلة الآن</span>
            <span>&larr;</span>
          </button>
          <a href="#products" class="btn-hero-secondary" onclick="applyCategory('sale', currentMall, null, 'العروض والتخفيضات الحصرية', true)">
            <span>شاهد التخفيضات %</span>
          </a>
        </div>
      </div>

      <!-- Image Card -->
      <div class="bento-image-card">
        <img id="heroImage" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85" 
             alt="مول باريس التجاري" class="bento-hero-img">
        <div class="hero-floating-glass-card">
          <div class="floating-crest-icon">💎</div>
          <div>
            <div class="floating-card-title" id="heroFloatingTitle">أفخم المنتجات المعتمدة</div>
            <div class="floating-card-sub" id="heroFloatingLink">ضمان جودة واستبدال مجاني</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ===================== 5. TRUST & BENEFITS STRIP ===================== -->
  <div class="paris-trust-strip-container">
    <div class="trust-strip-grid">
      
      <div class="trust-card">
        <div class="trust-icon-box">🚚</div>
        <div>
          <div class="trust-title">شحن فوري وسريع</div>
          <p class="trust-desc">توصيل لكافة المحافظات خلال 24-48 ساعة.</p>
        </div>
      </div>

      <div class="trust-card">
        <div class="trust-icon-box">🛡️</div>
        <div>
          <div class="trust-title">معاينة قبل الدفع</div>
          <p class="trust-desc">افحص المنتج وتأكد من المقاس قبل الاستلام.</p>
        </div>
      </div>

      <div class="trust-card">
        <div class="trust-icon-box">🔄</div>
        <div>
          <div class="trust-title">استبدال مجاني 14 يوماً</div>
          <p class="trust-desc">مرونة كاملة في الاسترجاع والتبديل بسهولة.</p>
        </div>
      </div>

      <div class="trust-card">
        <div class="trust-icon-box">💬</div>
        <div>
          <div class="trust-title">دعم VIP عبر واتساب</div>
          <p class="trust-desc">فريق متخصص لمساعدتك على مدار الساعة.</p>
        </div>
      </div>

    </div>
  </div>

  <!-- ===================== 6. PRODUCTS SECTION ===================== -->
  <section class="paris-products-container" id="products">

    <!-- Section Header Bar -->
    <div class="products-header-bar">
      <div>
        <h2 class="section-headline" id="sectionMainTitle">
          أناقتك اليومية، سر تميزك
          <span class="section-counter-badge" id="productsCountBadge">${publishedProducts.filter(p => p.mall === 'clothes').length} منتجات</span>
        </h2>
        <p class="section-subhead" id="sectionMainDesc">
          أحدث صيحات الموضة للأسر والشباب والأطفال بخامات قطنية راقية.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:12px;">
        <label style="font-size:13.5px; font-weight:700; color:var(--paris-forest);">ترتيب المعروضات:</label>
        <select id="sortSelect" onchange="sortProducts()" style="padding:8px 14px; border-radius:50px; border:1.5px solid var(--paris-border); font-family:inherit; font-size:13px; font-weight:700; color:var(--paris-forest); background:#fff; cursor:pointer; outline:none;">
          <option value="featured">الأكثر تميزاً وطلباً ⭐</option>
          <option value="price-asc">السعر: من الأقل للأعلى ⬆️</option>
          <option value="price-desc">السعر: من الأعلى للأقل ⬇️</option>
          <option value="rating">الأعلى تقييماً 🏆</option>
        </select>
      </div>
    </div>

    <!-- Filter Pills Row -->
    <div class="filter-pills-row" id="filterPillsContainer">
      <!-- Injected via renderFilterPills() -->
    </div>

    <!-- Products Grid -->
    <ul class="paris-products-grid" id="productsGrid">
      ${cardsHtml}
    </ul>

  </section>

  <!-- ===================== 7. QUICK VIEW MODAL ===================== -->
  <div class="paris-quickview-backdrop" id="quickViewBackdrop">
    <div class="quickview-modal-card">
      <button class="qv-close-btn" onclick="closeQuickView()">&times;</button>
      
      <div class="quickview-img-box">
        <img id="qvModalImg" src="" alt="">
      </div>

      <div class="quickview-details-box">
        <div class="qv-dept-badge" id="qvModalDept">قسم المتجر</div>
        <h3 class="qv-title" id="qvModalTitle">عنوان المنتج</h3>
        
        <div class="card-rating-strip" style="margin-bottom:14px;">
          <div class="stars-gold">★★★★★</div>
          <span class="rating-num">4.9</span>
          <span class="rating-count">(تقييمات العملاء الموثقة)</span>
        </div>

        <div class="qv-price-wrap">
          <span class="qv-price-val" id="qvModalPrice">0 ج.م</span>
          <span class="qv-old-price" id="qvModalOldPrice">0 ج.م</span>
        </div>

        <div id="qvSizesWrap">
          <div class="qv-selector-title">المقاس المطلوب:</div>
          <div class="qv-chips-list" id="qvModalSizesList"></div>
        </div>

        <div id="qvColorsWrap">
          <div class="qv-selector-title">اللون المفضل:</div>
          <div class="qv-chips-list" id="qvModalColorsList"></div>
        </div>

        <div class="qv-highlights-list" id="qvModalHighlights">
          ✨ خامات عالية الجودة ومضمونة 100%<br>
          🚚 شحن سريع مع حق الفحص والمعاينة قبل الاستلام<br>
          🔄 استبدال واسترجاع فوري خلال 14 يوماً
        </div>

        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:10px; margin-top:auto;">
          <button type="button" class="btn-card-add-cart" id="qvAddToCartBtn" style="padding:14px; font-size:15px;">
            <span>أضف إلى السلة 🛒</span>
          </button>
          <button type="button" class="btn-card-whatsapp-quick" id="qvWhatsAppBtn" style="padding:14px; font-size:15px;">
            <span>طلب فوري واتساب 📱</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ===================== 8. SIDE CART DRAWER ===================== -->
  <div class="paris-cart-overlay" id="cartOverlay"></div>
  <div class="paris-cart-panel" id="cartPanel" role="dialog" aria-label="سلة التسوق">
    
    <div class="cart-panel-header">
      <div class="cart-panel-title">
        <span>🛍️ سلة مشترياتك</span>
        <span class="cart-badge-count" id="cartHeaderBadge" style="background:var(--paris-gold); color:#0f3322;">0</span>
      </div>
      <button class="qv-close-btn" id="cartCloseBtn" style="position:static; background:rgba(255,255,255,0.15); color:#fff;">&times;</button>
    </div>

    <div class="cart-free-shipping-bar">
      <div id="freeShippingText">🚚 أضف بـ 150 ج.م إضافية للحصول على شحن مجاني!</div>
      <div class="cart-progress-track">
        <div class="cart-progress-fill" id="shippingProgressFill"></div>
      </div>
    </div>

    <div class="cart-panel-items-box">
      <div id="cartEmptyState" style="text-align:center; padding:60px 20px;">
        <span style="font-size:55px;">🛍️</span>
        <h4 style="margin:16px 0 8px; font-size:19px; color:var(--paris-forest);">سلتك فارغة حالياً</h4>
        <p style="color:var(--paris-text-muted); font-size:14px; line-height:1.6;">تصفح أقسام المول وأضف منتجاتك المفضلة بنقرة زر واحدة.</p>
      </div>
      <div id="cartItemsList" style="display:none;"></div>
    </div>

    <div class="cart-panel-footer">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:15px;">
        <span style="color:var(--paris-text-muted);">المجموع الفرعي:</span>
        <strong id="cartSubtotalVal" style="color:var(--paris-forest); font-size:17px;">0 ج.م</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:13.5px; color:#107c41;">
        <span>الشحن والتوصيل:</span>
        <span id="cartShippingVal">الدفع عند الاستلام</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; font-size:19px; font-weight:900; color:var(--paris-forest); border-top:1px dashed #ded7c8; padding-top:12px;">
        <span>الإجمالي النهائي:</span>
        <span id="cartTotalVal">0 ج.م</span>
      </div>

      <button type="button" class="btn-card-whatsapp-quick" id="openCheckoutModalBtn" style="width:100%; padding:14px; font-size:16px; border-radius:50px;">
        <span>تأكيد الطلب عبر واتساب الآن &larr;</span>
      </button>
    </div>

  </div>

  <!-- ===================== 9. CHECKOUT DATA MODAL ===================== -->
  <div class="paris-quickview-backdrop" id="checkoutModal">
    <div style="background:#fff; border-radius:var(--paris-radius-lg); max-width:500px; width:100%; padding:32px; position:relative; box-shadow:var(--paris-shadow-lg);">
      <button class="qv-close-btn" id="modalCloseBtn">&times;</button>
      <h3 style="font-size:20px; font-weight:900; color:var(--paris-forest); margin:0 0 8px;">تأكيد وحجز الطلب السريع</h3>
      <p style="color:var(--paris-text-muted); font-size:13.5px; margin:0 0 20px;">املأ بياناتك وسيتم إرسال الفاتورة لخدمة العملاء على الواتساب فوراً:</p>

      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:13px; font-weight:700; margin-bottom:5px;">الاسم الكريم:</label>
        <input type="text" id="custName" placeholder="أدخل اسمك بالكامل" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
      </div>

      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:13px; font-weight:700; margin-bottom:5px;">رقم الهاتف (الواتساب):</label>
        <input type="tel" id="custPhone" placeholder="01xxxxxxxxx" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
      </div>

      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:13px; font-weight:700; margin-bottom:5px;">المحافظة:</label>
        <select id="custGov" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
          <option value="القاهرة">القاهرة</option>
          <option value="الجيزة">الجيزة</option>
          <option value="الإسكندرية">الإسكندرية</option>
          <option value="الدقهلية">الدقهلية</option>
          <option value="الشرقية">الشرقية</option>
          <option value="الغربية">الغربية</option>
          <option value="المنوفية">المنوفية</option>
          <option value="القليوبية">القليوبية</option>
          <option value="البحيرة">البحيرة</option>
          <option value="كفر الشيخ">كفر الشيخ</option>
          <option value="دمياط">دمياط</option>
          <option value="بورسعيد">بورسعيد</option>
          <option value="الإسماعيلية">الإسماعيلية</option>
          <option value="السويس">السويس</option>
          <option value="محافظة أخرى">محافظة أخرى</option>
        </select>
      </div>

      <div style="margin-bottom:18px;">
        <label style="display:block; font-size:13px; font-weight:700; margin-bottom:5px;">العنوان بالتفصيل:</label>
        <input type="text" id="custAddress" placeholder="المدينة، الشارع، علامة مميزة" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
      </div>

      <div style="background:#f7f5ef; padding:14px; border-radius:10px; margin-bottom:20px; font-size:14px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span>إجمالي الطلب:</span>
          <strong id="modalTotalVal" style="color:var(--paris-forest);">0 ج.م</strong>
        </div>
        <div style="display:flex; justify-content:space-between; color:#107c41; font-weight:700;">
          <span>طريقة الدفع:</span>
          <span>الدفع عند الاستلام بعد المعاينة</span>
        </div>
      </div>

      <button type="button" class="btn-card-whatsapp-quick" onclick="submitWhatsAppOrder()" style="width:100%; padding:14px; font-size:16px; border-radius:12px;">
        <span>إرسال الطلب عبر واتساب الآن 💬</span>
      </button>
    </div>
  </div>

  <!-- ===================== 10. LUXURY FOOTER ===================== -->
  <footer style="background:var(--paris-forest); color:#fff; padding:60px 24px 30px; margin-top:80px; border-top:3px solid var(--paris-gold);">
    <div style="max-width:1320px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:40px;">
      
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
          <div class="paris-brand-crest" style="width:40px; height:40px;">
            <svg viewBox="0 0 40 40" width="24" height="24" fill="none"><path d="M12 30V12C12 9.5 14 7.5 16.5 7.5C19 7.5 21 9.5 21 12V30" stroke="#d4af37" stroke-width="3.5" stroke-linecap="round"/><path d="M21 17C21 14.5 23 12.5 25.5 12.5C28 12.5 30 14.5 30 17V30" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/></svg>
          </div>
          <h3 style="color:#d4af37; font-size:1.4rem; margin:0; font-weight:900;">مول باريس التجاري</h3>
        </div>
        <p style="color:#c5d1cb; line-height:1.8; font-size:14px; margin:0 0 16px;">
          الوجهة الإلكترونية الأولى لأفخم الملابس الرجالية والحريمية وملابس الأطفال، بجانب أحدث مستلزمات المطبخ العصري والديكورات والأحذية العالمية بأعلى معايير الجودة.
        </p>
        <div style="display:flex; gap:10px;">
          <span style="background:rgba(255,255,255,0.1); padding:6px 14px; border-radius:50px; font-size:12px;">🛡️ جودة معتمدة</span>
          <span style="background:rgba(255,255,255,0.1); padding:6px 14px; border-radius:50px; font-size:12px;">🚚 شحن سريع</span>
        </div>
      </div>

      <div>
        <h4 style="color:#ffd875; font-size:1.15rem; margin-bottom:18px; font-weight:800;">أقسام المول الرئيسية</h4>
        <ul style="list-style:none; padding:0; margin:0; line-height:2.2; font-size:14.5px;">
          <li><a href="#products" onclick="switchMall('clothes')" style="color:#d6e2dc; text-decoration:none;">👗 مول الملابس والأزياء العالمية</a></li>
          <li><a href="#products" onclick="switchMall('home')" style="color:#d6e2dc; text-decoration:none;">🏠 مول الأدوات المنزلية والديكور</a></li>
          <li><a href="#products" onclick="switchMall('shoes')" style="color:#d6e2dc; text-decoration:none;">👟 مول الأحذية والرياضة</a></li>
          <li><a href="#products" onclick="applyCategory('kitchen', 'home', null, 'أدوات المطبخ', true)" style="color:#d6e2dc; text-decoration:none;">🍳 مستلزمات المطبخ الحديث</a></li>
        </ul>
      </div>

      <div>
        <h4 style="color:#ffd875; font-size:1.15rem; margin-bottom:18px; font-weight:800;">سياسات التسوق والأمان</h4>
        <ul style="list-style:none; padding:0; margin:0; line-height:2.2; font-size:14px; color:#d6e2dc;">
          <li>🚚 شحن لجميع محافظات جمهورية مصر العربية</li>
          <li>💵 الدفع عند الاستلام مع إمكانية فتح الشحنة والفحص</li>
          <li>🔄 استرجاع واستبدال مجاني خلال 14 يوماً</li>
          <li>📞 خط ساخن وخدمة عملاء VIP عبر واتساب</li>
        </ul>
      </div>

      <div>
        <h4 style="color:#ffd875; font-size:1.15rem; margin-bottom:18px; font-weight:800;">طرق الدفع والتواصل</h4>
        <p style="color:#d6e2dc; font-size:14px; line-height:1.7;">نستقبل استفساراتكم وحجوزاتكم طوال أيام الأسبوع 24/7:</p>
        <a href="https://wa.me/201065968425" target="_blank" style="display:inline-flex; align-items:center; gap:8px; background:#25d366; color:#fff; padding:12px 24px; border-radius:50px; text-decoration:none; font-weight:800; font-size:14px; margin-top:8px; box-shadow:0 6px 20px rgba(37,211,102,0.3);">
          <span>💬 محادثة فورية واتساب</span>
        </a>
      </div>

    </div>

    <div style="max-width:1320px; margin:45px auto 0; padding-top:24px; border-top:1px solid rgba(255,255,255,0.12); text-align:center; color:#95a59d; font-size:13px;">
      جميع الحقوق محفوظة &copy; 2026 <strong>متجر باريس التجاري (Paris Mall)</strong> | <a href="/login" style="color:#ffd875; text-decoration:none; margin-inline-start:12px;">بوابة المشرفين والأدمن 👤</a>
    </div>
  </footer>

  <!-- WhatsApp Float Button -->
  <a href="https://wa.me/201065968425" target="_blank" class="paris-wa-float" style="position:fixed; bottom:25px; left:25px; width:60px; height:60px; background:#25d366; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 25px rgba(37,211,102,0.45); z-index:9999; color:#fff; text-decoration:none; transition:all 0.3s;" aria-label="تواصل واتساب">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-1.118-.056-.277-.088-.636-.217-1.096-.416-1.936-.838-3.195-2.798-3.292-2.927-.098-.129-.785-1.045-.785-1.993 0-.948.497-1.414.674-1.606.177-.193.385-.241.513-.241.129 0 .257.002.369.006.118.005.276-.045.432.329.16.386.546 1.332.594 1.43.048.097.08.21.016.339-.064.13-.097.21-.193.322-.096.113-.203.252-.29.339-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.33.736.655 1.357.858 1.55.954.193.096.305.08.418-.049.112-.128.481-.561.61-.754.128-.193.257-.161.433-.096.177.064 1.123.53 1.316.626.193.097.321.145.369.226.048.08.048.466-.096.871z"/></svg>
  </a>

  <!-- Toast -->
  <div class="paris-toast" id="parisToast">
    <span>✅</span>
    <span id="toastMsg">تمت الإضافة بنجاح</span>
  </div>

  <!-- Client-side Script -->
  <script>
    const productsData = ${JSON.stringify(publishedProducts)};
    let cart = [];
    let currentMall = 'clothes';
    let currentFilter = 'all';
    let selectedQvProduct = null;
    let selectedQvSize = '';
    let selectedQvColor = '';

    const mallPillsData = {
      clothes: [
        { slug: 'all', label: 'كل الملابس', mall: 'clothes', title: 'كل تشكيلات الملابس' },
        { slug: 'men', label: 'ملابس رجالي', mall: 'clothes', title: 'ملابس رجالية فاخرة' },
        { slug: 'women', label: 'ملابس حريمي', mall: 'clothes', title: 'ملابس نسائية راقية' },
        { slug: 'kids', label: 'ملابس أطفال', mall: 'clothes', title: 'ملابس وأزياء أطفال' },
        { slug: 'sale', label: 'تخفيضات الملابس %', mall: 'clothes', title: 'عروض وتخفيضات الملابس' },
        { slug: 'everything', label: 'كل المعروضات', mall: 'all', title: 'جميع منتجات متجر باريس' }
      ],
      home: [
        { slug: 'all', label: 'كل الأدوات المنزلية', mall: 'home', title: 'كل الأدوات المنزلية والديكور' },
        { slug: 'kitchen', label: 'أدوات المطبخ', mall: 'home', title: 'أدوات ومستلزمات المطبخ' },
        { slug: 'decor', label: 'ديكورات', mall: 'home', title: 'ديكورات ومقتنيات المنزل' },
        { slug: 'textiles', label: 'مفروشات ومناشف', mall: 'home', title: 'المفروشات والمنسوجات القطنية' },
        { slug: 'org', label: 'منظمات المنزل', mall: 'home', title: 'منظمات وأدوات الترتيب' },
        { slug: 'sale', label: 'تخفيضات الأدوات %', mall: 'home', title: 'عروض وتخفيضات الأدوات المنزلية' },
        { slug: 'everything', label: 'كل المعروضات', mall: 'all', title: 'جميع منتجات متجر باريس' }
      ],
      shoes: [
        { slug: 'all', label: 'كل الأحذية', mall: 'shoes', title: 'كل تشكيلات الأحذية' },
        { slug: 'men', label: 'أحذية رجالي', mall: 'shoes', title: 'أحذية رجالية راقية' },
        { slug: 'women', label: 'أحذية حريمي', mall: 'shoes', title: 'أحذية نسائية أنيقة' },
        { slug: 'sports', label: 'أحذية رياضية', mall: 'shoes', title: 'أحذية وسنيكرز رياضي' },
        { slug: 'kids', label: 'أحذية أطفال', mall: 'shoes', title: 'أحذية وأزياء أطفال' },
        { slug: 'sale', label: 'تخفيضات الأحذية %', mall: 'shoes', title: 'عروض وتخفيضات الأحذية' },
        { slug: 'everything', label: 'كل المعروضات', mall: 'all', title: 'جميع منتجات متجر باريس' }
      ]
    };

    // DOM Elements
    const cartOverlay = document.getElementById('cartOverlay');
    const cartPanel = document.getElementById('cartPanel');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const headerCartCount = document.getElementById('headerCartCount');
    const cartHeaderBadge = document.getElementById('cartHeaderBadge');
    const cartSubtotalVal = document.getElementById('cartSubtotalVal');
    const cartTotalVal = document.getElementById('cartTotalVal');
    const shippingProgressFill = document.getElementById('shippingProgressFill');
    const freeShippingText = document.getElementById('freeShippingText');
    const parisToast = document.getElementById('parisToast');
    const toastMsg = document.getElementById('toastMsg');
    const checkoutModal = document.getElementById('checkoutModal');
    const quickViewBackdrop = document.getElementById('quickViewBackdrop');

    // Cart Listeners
    document.getElementById('openCartBtn').addEventListener('click', openCart);
    document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    document.getElementById('openCheckoutModalBtn').addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('السلة فارغة! يرجى إضافة منتجات أولاً');
        return;
      }
      closeCart();
      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      document.getElementById('modalTotalVal').innerText = total + ' ج.م';
      checkoutModal.style.display = 'flex';
    });

    document.getElementById('modalCloseBtn').addEventListener('click', () => {
      checkoutModal.style.display = 'none';
    });

    function showToast(msg) {
      toastMsg.innerText = msg;
      parisToast.style.display = 'flex';
      setTimeout(() => { parisToast.style.display = 'none'; }, 2600);
    }

    function copyCouponCode(code) {
      navigator.clipboard.writeText(code).then(() => {
        showToast('تم نسخ كود الخصم: ' + code);
      }).catch(() => {
        showToast('كود الخصم هو: ' + code);
      });
    }

    function toggleWishlist(btn, title) {
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        showToast('تمت إضافة "' + title.substring(0, 18) + '..." للمفضلة ❤️');
      } else {
        showToast('تمت الإزالة من المفضلة');
      }
    }

    function openCart() {
      cartOverlay.classList.add('active');
      cartPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderCart();
    }

    function closeCart() {
      cartOverlay.classList.remove('active');
      cartPanel.classList.remove('active');
      document.body.style.overflow = '';
    }

    function addToCart(title, price, img, size) {
      const existing = cart.find(item => item.title === title && item.size === size);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ title, price, img, size: size || '', qty: 1 });
      }
      updateCartBadge();
      showToast('تمت إضافة "' + title.substring(0, 20) + '..." إلى السلة 🛍️');
      openCart();
    }

    function updateCartBadge() {
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      headerCartCount.innerText = totalItems;
      cartHeaderBadge.innerText = totalItems;
    }

    function updateQty(index, delta) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) cart.splice(index, 1);
      updateCartBadge();
      renderCart();
    }

    function removeItem(index) {
      cart.splice(index, 1);
      updateCartBadge();
      renderCart();
    }

    function renderCart() {
      if (cart.length === 0) {
        cartEmptyState.style.display = 'block';
        cartItemsList.style.display = 'none';
        cartSubtotalVal.innerText = '0 ج.م';
        cartTotalVal.innerText = '0 ج.م';
        shippingProgressFill.style.width = '0%';
        freeShippingText.innerText = '🚚 أضف بـ 500 ج.م للحصول على شحن مجاني!';
        return;
      }

      cartEmptyState.style.display = 'none';
      cartItemsList.style.display = 'block';

      let total = 0;
      let html = '';

      cart.forEach((item, idx) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += \`
          <div style="display:flex; gap:14px; padding:14px 0; border-bottom:1px solid #eee; align-items:center;">
            <img src="\${item.img}" style="width:64px; height:64px; object-fit:cover; border-radius:10px; border:1px solid #e0dbce;">
            <div style="flex:1;">
              <h5 style="margin:0 0 4px; font-size:14px; font-weight:800; color:var(--paris-forest); line-height:1.3;">\${item.title}</h5>
              \${item.size ? \`<span style="font-size:11px; background:#f0ece3; color:#133e29; padding:1px 6px; border-radius:4px; font-weight:700;">مقاس: \${item.size}</span>\` : ''}
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span style="font-weight:900; color:var(--paris-forest); font-size:15px;">\${item.price} ج.م</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button type="button" onclick="updateQty(\${idx}, -1)" style="width:26px; height:26px; border-radius:50%; border:1px solid #ddd; background:#fff; cursor:pointer; font-weight:bold;">-</button>
                  <span style="font-weight:800; font-size:14px;">\${item.qty}</span>
                  <button type="button" onclick="updateQty(\${idx}, 1)" style="width:26px; height:26px; border-radius:50%; border:1px solid #ddd; background:#fff; cursor:pointer; font-weight:bold;">+</button>
                  <button type="button" onclick="removeItem(\${idx})" style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:14px; margin-inline-start:6px;" title="حذف">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        \`;
      });

      cartItemsList.innerHTML = html;
      cartSubtotalVal.innerText = total + ' ج.م';
      cartTotalVal.innerText = total + ' ج.م';

      // Free shipping progress
      const targetFree = 500;
      if (total >= targetFree) {
        shippingProgressFill.style.width = '100%';
        freeShippingText.innerHTML = '🎉 <strong>مبروك!</strong> لقد حصلت على شحن مجاني لطلبك!';
      } else {
        const remaining = targetFree - total;
        const pct = Math.min(100, Math.round((total / targetFree) * 100));
        shippingProgressFill.style.width = pct + '%';
        freeShippingText.innerText = '🚚 أضف بـ ' + remaining + ' ج.م إضافية للحصول على شحن مجاني!';
      }
    }

    function quickOrderWhatsApp(title, price) {
      const msg = 'مرحباً مول باريس 👋%0Aأود الاستفسار وحجز هذا المنتج فوراً:%0A' +
                  '• ' + encodeURIComponent(title) + '%0A' +
                  '• السعر: ' + price + ' ج.م%0A' +
                  'يرجى تأكيد التوافر وتفاصيل الشحن.';
      window.open('https://wa.me/201065968425?text=' + msg, '_blank');
    }

    function submitWhatsAppOrder() {
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const gov = document.getElementById('custGov').value;
      const addr = document.getElementById('custAddress').value.trim();

      if (!name || !phone || !addr) {
        showToast('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      let itemsText = '';
      cart.forEach((item, i) => {
        itemsText += (i+1) + '. ' + item.title + (item.size ? ' [مقاس: ' + item.size + ']' : '') + ' (الكمية: ' + item.qty + ') - ' + (item.price * item.qty) + ' ج.م%0A';
      });

      const orderMsg = '🛍️ *طلب شراء جديد من متجر باريس* 🛍️%0A%0A' +
                       '*بيانات العميل:*%0A' +
                       '• الاسم: ' + encodeURIComponent(name) + '%0A' +
                       '• الهاتف: ' + encodeURIComponent(phone) + '%0A' +
                       '• المحافظة: ' + encodeURIComponent(gov) + '%0A' +
                       '• العنوان: ' + encodeURIComponent(addr) + '%0A%0A' +
                       '*تفاصيل المنتجات:*%0A' + itemsText + '%0A' +
                       '*إجمالي الفاتورة:* ' + total + ' ج.م%0A' +
                       '*طريقة الدفع:* الدفع عند الاستلام بعد المعاينة.%0A%0A' +
                       'يرجى تأكيد تجهيز الشحنة والتوصيل.';

      window.open('https://wa.me/201065968425?text=' + orderMsg, '_blank');
      checkoutModal.style.display = 'none';
      cart = [];
      updateCartBadge();
      renderCart();
      showToast('تم إرسال طلبك بنجاح عبر واتساب!');
    }

    // Quick View Modal
    function openQuickView(productId) {
      const prod = productsData.find(p => p.id === productId);
      if (!prod) return;
      selectedQvProduct = prod;

      document.getElementById('qvModalImg').src = prod.image || '';
      document.getElementById('qvModalTitle').innerText = prod.title;
      document.getElementById('qvModalPrice').innerText = prod.price + ' ج.م';
      document.getElementById('qvModalOldPrice').innerText = (prod.regularPrice && prod.regularPrice > prod.price) ? (prod.regularPrice + ' ج.م') : '';
      
      let deptName = 'قسم الأدوات المنزلية';
      if (prod.mall === 'clothes') deptName = 'قسم الأزياء والملابس';
      if (prod.mall === 'shoes') deptName = 'قسم الأحذية والرياضة';
      document.getElementById('qvModalDept').innerText = deptName;

      // Sizes
      const sizesBox = document.getElementById('qvModalSizesList');
      const sizesWrap = document.getElementById('qvSizesWrap');
      if (prod.sizes && prod.sizes.length) {
        sizesWrap.style.display = 'block';
        selectedQvSize = prod.sizes[0];
        sizesBox.innerHTML = prod.sizes.map((s, idx) => \`
          <button type="button" class="qv-chip \${idx === 0 ? 'selected' : ''}" onclick="selectQvSize(this, '\${s}')">\${s}</button>
        \`).join('');
      } else {
        sizesWrap.style.display = 'none';
        selectedQvSize = '';
      }

      // Colors
      const colorsBox = document.getElementById('qvModalColorsList');
      const colorsWrap = document.getElementById('qvColorsWrap');
      const colors = (prod.colors && prod.colors.length) ? prod.colors : ['أسود', 'كحلي', 'أبيض'];
      colorsWrap.style.display = 'block';
      selectedQvColor = colors[0];
      colorsBox.innerHTML = colors.map((c, idx) => \`
        <button type="button" class="qv-chip \${idx === 0 ? 'selected' : ''}" onclick="selectQvColor(this, '\${c}')">\${c}</button>
      \`).join('');

      // Add to cart & WhatsApp button handlers
      document.getElementById('qvAddToCartBtn').onclick = () => {
        addToCart(prod.title, prod.price, prod.image, selectedQvSize);
        closeQuickView();
      };

      document.getElementById('qvWhatsAppBtn').onclick = () => {
        const text = prod.title + (selectedQvSize ? ' (مقاس: ' + selectedQvSize + ')' : '') + (selectedQvColor ? ' (لون: ' + selectedQvColor + ')' : '');
        quickOrderWhatsApp(text, prod.price);
      };

      quickViewBackdrop.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeQuickView() {
      quickViewBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    }

    function selectQvSize(btn, size) {
      document.querySelectorAll('#qvModalSizesList .qv-chip').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedQvSize = size;
    }

    function selectQvColor(btn, color) {
      document.querySelectorAll('#qvModalColorsList .qv-chip').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedQvColor = color;
    }

    // Mall and Category Filtering
    function countCategoryProducts(slug, mall) {
      const cards = document.querySelectorAll('#productsGrid .paris-modern-card');
      let count = 0;
      cards.forEach(card => {
        const cardMall = card.getAttribute('data-mall');
        const cardCats = (card.getAttribute('data-category') || '').split(/\\s+/);
        const isSale = card.getAttribute('data-sale') === 'true';

        if (slug === 'everything') {
          count++;
        } else if (slug === 'all') {
          if (cardMall === (mall || currentMall)) count++;
        } else if (slug === 'sale') {
          if (isSale && (mall === 'all' || cardMall === (mall || currentMall))) count++;
        } else {
          if (cardCats.includes(slug) && cardMall === (mall || currentMall)) count++;
        }
      });
      return count;
    }

    function renderFilterPills(activeSlug) {
      const container = document.getElementById('filterPillsContainer');
      if (!container) return;

      const activeList = mallPillsData[currentMall] || mallPillsData['clothes'];
      let html = '';

      activeList.forEach(item => {
        const isActive = (item.slug === activeSlug);
        const count = countCategoryProducts(item.slug, item.mall);
        html += \`
          <button type="button" class="filter-pill-btn \${isActive ? 'active' : ''}" 
                  onclick="applyCategory('\${item.slug}', '\${item.mall}', null, '\${item.title}', false)">
            <span>\${item.label}</span>
            <span class="pill-counter">\${count}</span>
          </button>
        \`;
      });

      container.innerHTML = html;
    }

    function applyCategory(slug, targetMall, linkEl, labelTitle, shouldScroll) {
      currentFilter = slug;

      if (targetMall && targetMall !== 'all' && targetMall !== currentMall) {
        switchMall(targetMall, false);
      }

      // Update Subnav active state
      document.querySelectorAll('.subnav-chip-link').forEach(l => {
        l.classList.remove('active');
        const lSlug = l.getAttribute('data-slug');
        const lMall = l.getAttribute('data-mall');
        if (lSlug === slug && (!lMall || lMall === currentMall)) {
          l.classList.add('active');
        }
      });
      if (linkEl) linkEl.classList.add('active');

      // Filter product cards strictly
      const cards = document.querySelectorAll('#productsGrid .paris-modern-card');
      let count = 0;

      cards.forEach(card => {
        const cardMall = card.getAttribute('data-mall');
        const cardCats = (card.getAttribute('data-category') || '').split(/\\s+/);
        const isSale = card.getAttribute('data-sale') === 'true';

        let matches = false;

        if (slug === 'everything') {
          matches = true;
        } else if (slug === 'all') {
          matches = (cardMall === currentMall);
        } else if (slug === 'sale') {
          matches = isSale && (targetMall === 'all' || cardMall === currentMall);
        } else {
          if (targetMall && targetMall !== 'all') {
            matches = (cardMall === targetMall) && cardCats.includes(slug);
          } else {
            matches = cardCats.includes(slug) && (cardMall === currentMall);
          }
        }

        if (matches) {
          card.classList.remove('is-hidden');
          card.style.setProperty('display', 'flex', 'important');
          count++;
        } else {
          card.classList.add('is-hidden');
          card.style.setProperty('display', 'none', 'important');
        }
      });

      // Update section titles
      const sectionTitle = document.getElementById('sectionMainTitle');
      const displayTitle = labelTitle || (slug === 'all' ? (currentMall === 'clothes' ? 'كل الملابس' : (currentMall==='shoes'?'كل الأحذية':'كل الأدوات المنزلية')) : slug);
      if (sectionTitle) {
        sectionTitle.innerHTML = \`\${displayTitle} <span class="section-counter-badge" id="productsCountBadge">\${count} \${count === 1 ? 'منتج' : 'منتجات'}</span>\`;
      }

      renderFilterPills(slug);
      if (shouldScroll) scrollToProducts();
    }

    function switchMall(mall, filterAll = true) {
      currentMall = mall;
      const tabClothes = document.getElementById('tabClothes');
      const tabHome = document.getElementById('tabHome');
      const tabShoes = document.getElementById('tabShoes');
      const subnavClothes = document.getElementById('subnav-clothes');
      const subnavHome = document.getElementById('subnav-home');
      const subnavShoes = document.getElementById('subnav-shoes');

      const heroEyebrow = document.getElementById('heroEyebrow');
      const heroTitle = document.getElementById('heroTitle');
      const heroDesc = document.getElementById('heroDesc');
      const heroBtnText = document.getElementById('heroBtnText');
      const heroFloatingTitle = document.getElementById('heroFloatingTitle');
      const heroFloatingLink = document.getElementById('heroFloatingLink');
      const heroImage = document.getElementById('heroImage');
      const sectionMainDesc = document.getElementById('sectionMainDesc');
      const searchCatSelect = document.getElementById('searchCategory');

      // Reset tabs
      if (tabClothes) tabClothes.classList.remove('active');
      if (tabHome) tabHome.classList.remove('active');
      if (tabShoes) tabShoes.classList.remove('active');
      if (subnavClothes) subnavClothes.classList.remove('active');
      if (subnavHome) subnavHome.classList.remove('active');
      if (subnavShoes) subnavShoes.classList.remove('active');

      if (mall === 'clothes') {
        if (tabClothes) tabClothes.classList.add('active');
        if (subnavClothes) subnavClothes.classList.add('active');
        if (searchCatSelect) searchCatSelect.value = 'clothes';

        if (heroEyebrow) heroEyebrow.innerText = 'تشكيلة باريس للأزياء 2026 — أرقى الموديلات لك ولعائلتك';
        if (heroTitle) heroTitle.innerHTML = 'أناقتك اليومية..<br><span class=\"gold-text\">خيارات تليق بذوقك الرفيع</span>';
        if (heroDesc) heroDesc.innerText = 'اكتشف أحدث تشكيلات الملابس الرجالية، الحريمية، وملابس الأطفال بخامات قطنية ممتازة وتوصيل فوري.';
        if (heroBtnText) heroBtnText.innerText = 'تسوق تشكيلة الملابس الآن';
        if (heroFloatingTitle) heroFloatingTitle.innerText = 'أناقتك اليومية في الصدارة';
        if (heroFloatingLink) heroFloatingLink.innerText = 'خامات قطنية فاخرة 100%';
        if (heroImage) heroImage.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=85';
        if (sectionMainDesc) sectionMainDesc.innerText = 'أحدث صيحات الموضة للأسر والشباب والأطفال بخامات قطنية راقية.';

        if (filterAll) applyCategory('all', 'clothes', null, 'كل تشكيلات الملابس', false);
      } else if (mall === 'shoes') {
        if (tabShoes) tabShoes.classList.add('active');
        if (subnavShoes) subnavShoes.classList.add('active');
        if (searchCatSelect) searchCatSelect.value = 'shoes';

        if (heroEyebrow) heroEyebrow.innerText = 'قسم الأحذية والرياضة 2026 — راحة وأناقة لكل خطوة';
        if (heroTitle) heroTitle.innerHTML = 'خطوتك الأولى للأناقة..<br><span class=\"gold-text\">راحة وفخامة تدوم طويلاً</span>';
        if (heroDesc) heroDesc.innerText = 'أحدث موديلات الأحذية الجلدية الطبيعية، السنيكرز الرياضي، والأحذية الكاجوال والطبية لجميع أفراد الأسرة.';
        if (heroBtnText) heroBtnText.innerText = 'تسوق تشكيلة الأحذية الآن';
        if (heroFloatingTitle) heroFloatingTitle.innerText = 'أحدث صيحات الأحذية والسنيكرز';
        if (heroFloatingLink) heroFloatingLink.innerText = 'تصاميم مريحة وطبية معتمدة';
        if (heroImage) heroImage.src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&auto=format&fit=crop&q=85';
        if (sectionMainDesc) sectionMainDesc.innerText = 'تشكيلة متكاملة من الأحذية الرجالية، الحريمية، والرياضية بأعلى جودة.';

        if (filterAll) applyCategory('all', 'shoes', null, 'كل تشكيلات الأحذية', false);
      } else {
        // Home Mall
        if (tabHome) tabHome.classList.add('active');
        if (subnavHome) subnavHome.classList.add('active');
        if (searchCatSelect) searchCatSelect.value = 'home';

        if (heroEyebrow) heroEyebrow.innerText = 'الأدوات المنزلية والديكور 2026 — كل ركن في بيتك له اختيار';
        if (heroTitle) heroTitle.innerHTML = 'بيتك يستاهل الأفضل..<br><span class=\"gold-text\">خيارات تجمله وتسهل حياتك</span>';
        if (heroDesc) heroDesc.innerText = 'اكتشف أحدث أدوات المطبخ العصري، الديكورات، المفروشات التركية، ومنظمات التخزين بأعلى جودة.';
        if (heroBtnText) heroBtnText.innerText = 'تسوق الأدوات المنزلية الآن';
        if (heroFloatingTitle) heroFloatingTitle.innerText = 'جودة بيتية تدوم لسنوات';
        if (heroFloatingLink) heroFloatingLink.innerText = 'اكتشف أطقم المطبخ والديكور';
        if (heroImage) heroImage.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=85';
        if (sectionMainDesc) sectionMainDesc.innerText = 'أدوات منزلية ومستلزمات عملية لحياة يومية أسهل وأجمل.';

        if (filterAll) applyCategory('all', 'home', null, 'كل الأدوات المنزلية والديكور', false);
      }
    }

    function onSearchScopeChange() {
      const scope = document.getElementById('searchCategory').value;
      if (scope === 'clothes') switchMall('clothes', true);
      else if (scope === 'home') switchMall('home', true);
      else if (scope === 'shoes') switchMall('shoes', true);
      else applyCategory('everything', 'all', null, 'كل معروضات المتجر', true);
    }

    function searchProducts() {
      const cat = document.getElementById('searchCategory').value.toLowerCase();
      const q = document.getElementById('searchInput').value.trim().toLowerCase();
      const cards = document.querySelectorAll('#productsGrid .paris-modern-card');
      let count = 0;

      cards.forEach(card => {
        const title = card.querySelector('.card-product-title').innerText.toLowerCase();
        const cardCats = (card.getAttribute('data-category') || '').toLowerCase();
        const cardMall = card.getAttribute('data-mall').toLowerCase();

        let matchesCat = true;
        if (cat) matchesCat = (cardMall === cat || cardCats.includes(cat));

        let matchesQ = true;
        if (q) matchesQ = title.includes(q) || cardCats.includes(q);

        if (matchesCat && matchesQ) {
          card.classList.remove('is-hidden');
          card.style.setProperty('display', 'flex', 'important');
          count++;
        } else {
          card.classList.add('is-hidden');
          card.style.setProperty('display', 'none', 'important');
        }
      });

      const sectionTitle = document.getElementById('sectionMainTitle');
      if (sectionTitle) {
        sectionTitle.innerHTML = 'نتائج البحث (' + (q || 'الكل') + ') <span class=\"section-counter-badge\" id=\"productsCountBadge\">' + count + ' منتج</span>';
      }
      scrollToProducts();
    }

    function sortProducts() {
      const sortVal = document.getElementById('sortSelect').value;
      const grid = document.getElementById('productsGrid');
      const cards = Array.from(grid.querySelectorAll('.paris-modern-card'));

      cards.sort((a, b) => {
        const priceA = parseFloat(a.getAttribute('data-price')) || 0;
        const priceB = parseFloat(b.getAttribute('data-price')) || 0;
        const idA = parseInt(a.getAttribute('data-id')) || 0;
        const idB = parseInt(b.getAttribute('data-id')) || 0;

        if (sortVal === 'price-asc') return priceA - priceB;
        if (sortVal === 'price-desc') return priceB - priceA;
        if (sortVal === 'rating') return idB - idA;
        return idA - idB; // featured
      });

      cards.forEach(card => grid.appendChild(card));
    }

    function scrollToProducts() {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    // Initialize to Clothes Mall
    switchMall('clothes', true);
  </script>
</body>
</html>
  `;

  // Write store.html and index.html
  const storeFilePath = path.join(basePath, 'store.html');
  const indexFilePath = path.join(basePath, 'index.html');
  fs.writeFileSync(storeFilePath, fullHtml, 'utf8');
  fs.writeFileSync(indexFilePath, fullHtml, 'utf8');
  console.log(`Successfully regenerated store.html & index.html with ${publishedProducts.length} published products in World-Class Luxury Style!`);
}

module.exports = { buildStore };

if (require.main === module) {
  buildStore();
}
