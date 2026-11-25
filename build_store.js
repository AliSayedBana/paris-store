const fs = require('fs');
const path = require('path');
const { getStoreSettings } = require('./settings_utils');

const basePath = __dirname;

function buildStore() {
  const settings = getStoreSettings();
  const activeCouponsMap = {};
  (settings.coupons || []).forEach(c => {
    if (c.active && c.code) {
      activeCouponsMap[c.code.toUpperCase()] = {
        rate: (Number(c.rate) || 10) / 100,
        label: c.label || `خصم ${Number(c.rate) || 10}%`
      };
    }
  });

  let pixelsScripts = '';
  if (settings.pixels && settings.pixels.metaPixelId) {
    const pid = settings.pixels.metaPixelId;
    pixelsScripts += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pid}');fbq('track','PageView');</script>`;
  }
  if (settings.pixels && settings.pixels.tiktokPixelId) {
    const tid = settings.pixels.tiktokPixelId;
    pixelsScripts += `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tid}');ttq.page()}(window,document,'ttq');</script>`;
  }
  if (settings.pixels && settings.pixels.gaMeasurementId) {
    const gid = settings.pixels.gaMeasurementId;
    pixelsScripts += `<script async src="https://www.googletagmanager.com/gtag/js?id=${gid}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gid}');</script>`;
  }

  const productsPath = path.join(basePath, 'products.json');
  let products = [];
  if (fs.existsSync(productsPath)) {
    try {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    } catch (e) {
      console.error('Error reading products.json:', e);
    }
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
    const formattedPrice = Number(p.price).toLocaleString('en-US');
    const formattedReg = (p.regularPrice && p.regularPrice > p.price) ? Number(p.regularPrice).toLocaleString('en-US') : '';
    const formattedSave = discountAmount > 0 ? Number(discountAmount).toLocaleString('en-US') : '';

    const isHighTicket = false;
    const installmentTag = '';
    const highTicketTrustTag = p.price >= 1000
      ? `<div class="card-vip-trust">🛡️ معاينة كاملة وفحص مع المندوب قبل الدفع</div>`
      : '';

    // Price display
    const priceDisplay = `
      <div class="paris-card-price-row">
        <span class="price-current">${formattedPrice} <span class="curr">ج.م</span></span>
        ${formattedReg ? `<span class="price-old">${formattedReg} ج.م</span>` : ''}
        ${formattedSave ? `<span class="price-save">وفّر ${formattedSave} ج.م</span>` : ''}
      </div>
      ${installmentTag}
      ${highTicketTrustTag}
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
    const stockVal = (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock))) ? Math.max(0, Number(p.stock)) : 10;
    const isOutOfStock = stockVal <= 0;
    const stockPillHtml = isOutOfStock
      ? `<div style="font-size:11px; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:2px 8px; border-radius:6px; font-weight:800; width:fit-content; margin-bottom:6px;">🚫 نفدت الكمية</div>`
      : (stockVal <= 3
          ? `<div style="font-size:11px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; padding:2px 8px; border-radius:6px; font-weight:800; width:fit-content; margin-bottom:6px;">🔥 متبقي ${stockVal} قطع فقط!</div>`
          : `<div style="font-size:10.5px; color:#15803d; font-weight:700; margin-bottom:6px;">✓ متوفر بالمخزن (${stockVal})</div>`);

    cardsHtml += `
      <!-- Product Card #${p.id} -->
      <li class="product paris-modern-card" 
          data-category="${p.category}" 
          data-mall="${p.mall}" 
          data-sale="${saleStr}" 
          data-id="${p.id}" 
          data-price="${p.price}" 
          data-stock="${stockVal}"
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
            ${stockPillHtml}

            <!-- Dual Action Buttons -->
            <div class="card-action-buttons-group">
              <button type="button" class="btn-card-add-cart" ${isOutOfStock ? 'style="background:#9ca3af; cursor:not-allowed;"' : ''} onclick="addToCart('${safeTitle}', ${p.price}, '${safeImg}', '${(p.sizes && p.sizes[0]) || ''}', ${p.id})">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>${isOutOfStock ? 'نفدت الكمية 🚫' : 'أضف للسلة'}</span>
              </button>

              <button type="button" class="btn-card-whatsapp-quick" onclick="${isOutOfStock ? `notifyRestockWhatsApp('${safeTitle}')` : `quickOrderWhatsApp('${safeTitle}', ${p.price})`}" title="${isOutOfStock ? 'أخبرني عند توفر المنتج' : 'طلب سريع عبر واتساب'}">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-1.118-.056-.277-.088-.636-.217-1.096-.416-1.936-.838-3.195-2.798-3.292-2.927-.098-.129-.785-1.045-.785-1.993 0-.948.497-1.414.674-1.606.177-.193.385-.241.513-.241.129 0 .257.002.369.006.118.005.276-.045.432.329.16.386.546 1.332.594 1.43.048.097.08.21.016.339-.064.13-.097.21-.193.322-.096.113-.203.252-.29.339-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.33.736.655 1.357.858 1.55.954.193.096.305.08.418-.049.112-.128.481-.561.61-.754.128-.193.257-.161.433-.096.177.064 1.123.53 1.316.626.193.097.321.145.369.226.048.08.048.466-.096.871z"/></svg>
                <span>${isOutOfStock ? 'أخبرني عند التوفر 🔔' : 'طلب واتساب'}</span>
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
  <meta name="theme-color" content="#0f3322">
  <title>متجر باريس | Paris Store — أفخم مول تجاري للتسوق الإلكتروني</title>
  <meta name="description" content="متجر باريس التجاري — تسوق أفخم الأزياء والملابس، الأدوات المنزلية الملكية، والأحذية الإيطالية والرياضية مع حق المعاينة الكاملة مع المندوب قبل الدفع.">
  <meta property="og:title" content="متجر باريس | Paris Store — تجربة تسوق فاخرة">
  <meta property="og:description" content="ملابس فاخرة، أطقم طهي ملكية، وأحذية جلد طبيعي مع شحن سريع لجميع المحافظات وحق الفحص والمعاينة قبل الدفع.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_EG">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%230f3322'/%3E%3Cpath d='M12 30V12C12 9.5 14 7.5 16.5 7.5C19 7.5 21 9.5 21 12V30' stroke='%23d4af37' stroke-width='3.5' stroke-linecap='round' fill='none'/%3E%3Cpath d='M21 17C21 14.5 23 12.5 25.5 12.5C28 12.5 30 14.5 30 17V30' stroke='%23ffffff' stroke-width='3.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/themes/storefront-paris-child/assets/css/paris-store.css">
  ${pixelsScripts}
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
      margin-bottom: 6px;
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
    .card-installment-tag {
      font-size: 11px;
      color: #0d5c3a;
      background: #edf7f0;
      border: 1px dashed #a3d9b5;
      padding: 3px 8px;
      border-radius: 6px;
      margin-bottom: 5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      width: fit-content;
    }
    .card-vip-trust {
      font-size: 10.5px;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 2px 7px;
      border-radius: 5px;
      margin-bottom: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      width: fit-content;
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      gap: 14px;
    }
    .quickview-main-frame {
      width: 100%;
      height: 360px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: var(--paris-radius-md);
      background: #fff;
      cursor: zoom-in;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .quickview-main-frame.zoomed {
      cursor: zoom-out;
    }
    .quickview-main-frame img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.35s ease;
    }
    .quickview-main-frame.zoomed img {
      transform: scale(1.65);
    }
    .qv-thumbs-strip {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .qv-thumb-btn {
      width: 58px;
      height: 58px;
      border-radius: 10px;
      border: 2px solid #ded7c8;
      padding: 2px;
      background: #fff;
      cursor: pointer;
      overflow: hidden;
      transition: var(--transition-smooth);
    }
    .qv-thumb-btn.active, .qv-thumb-btn:hover {
      border-color: var(--paris-forest);
      transform: translateY(-2px);
    }
    .qv-thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }
    .qv-size-guide-box {
      display: none;
      background: #f8faf8;
      border: 1px solid #cce3d8;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 14px;
      font-size: 12px;
      color: var(--paris-forest);
    }
    .qv-size-guide-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      text-align: center;
    }
    .qv-size-guide-table th, .qv-size-guide-table td {
      border: 1px solid #d9e7df;
      padding: 4px 6px;
    }
    .qv-size-guide-table th {
      background: #eaf4ee;
      font-weight: 800;
    }

    /* Customer Reviews Section */
    .paris-reviews-section {
      max-width: 1320px;
      margin: 60px auto 0;
      padding: 0 24px;
    }
    .reviews-bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }
    .review-vip-card {
      background: #fff;
      border: 1.5px solid var(--paris-border);
      border-radius: 18px;
      padding: 22px;
      box-shadow: var(--paris-shadow-sm);
      transition: var(--transition-smooth);
    }
    .review-vip-card:hover {
      transform: translateY(-4px);
      border-color: var(--paris-gold);
      box-shadow: var(--paris-shadow-md);
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

    /* ===================== BUDGET & PRODUCTS CHATBOT ===================== */
    .paris-bot-toggle {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: linear-gradient(135deg, var(--paris-forest) 0%, #164b33 100%);
      color: #fff;
      border: 2px solid var(--paris-gold);
      border-radius: 50px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 9px;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 28px rgba(15, 51, 34, 0.35);
      z-index: 9998;
      transition: all 0.25s ease;
    }
    .paris-bot-toggle:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(15, 51, 34, 0.45);
    }
    .paris-bot-window {
      position: fixed;
      bottom: 90px;
      right: 25px;
      width: 390px;
      max-width: calc(100vw - 32px);
      height: 550px;
      max-height: 78vh;
      background: #fff;
      border-radius: 20px;
      border: 1.5px solid var(--paris-border);
      box-shadow: 0 20px 55px rgba(10, 28, 18, 0.28);
      z-index: 9999;
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .paris-bot-header {
      background: linear-gradient(135deg, var(--paris-forest) 0%, #164b33 100%);
      color: #fff;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--paris-gold);
    }
    .paris-bot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      background: #f8f9f8;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bot-msg {
      background: #fff;
      border: 1px solid #e4e1d6;
      color: var(--paris-text-main);
      padding: 10px 13px;
      border-radius: 14px 14px 14px 4px;
      font-size: 13px;
      line-height: 1.6;
      max-width: 92%;
      align-self: flex-start;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .user-msg {
      background: var(--paris-forest);
      color: #fff;
      padding: 9px 13px;
      border-radius: 14px 14px 4px 14px;
      font-size: 13px;
      font-weight: 700;
      max-width: 82%;
      align-self: flex-end;
    }
    .bot-quick-row {
      padding: 8px 10px;
      background: #fff;
      border-top: 1px solid #eee;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: flex-start;
    }
    .bot-chip {
      background: #f4f1ea;
      border: 1px solid #ded7c8;
      color: var(--paris-forest);
      padding: 4px 9px;
      border-radius: 50px;
      font-family: inherit;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
    }
    .bot-chip:hover {
      background: var(--paris-forest);
      color: #fff;
      border-color: var(--paris-forest);
    }
    .bot-prod-mini {
      display: flex;
      gap: 9px;
      align-items: center;
      background: #fbfaf7;
      border: 1px solid #e5e0d5;
      border-radius: 10px;
      padding: 7px;
      margin-top: 7px;
    }
    .bot-prod-mini img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .paris-bot-input-bar {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: #fff;
      border-top: 1.5px solid #e8e3d8;
    }
  </style>
</head>
<body>

  <!-- ===================== 1. ANNOUNCEMENT TICKER ===================== -->
  <div class="paris-top-bar">
    <div class="paris-top-bar-inner">
      <div style="display:flex; align-items:center;">
        ${settings.announcementText ? `<span>✨ ${settings.announcementText}</span>` : ''}
        ${settings.activeCouponBannerCode ? `<span class="top-promo-pill" onclick="copyCouponCode('${settings.activeCouponBannerCode}')" title="انقر لنسخ وتفعيل كود الخصم">كود: ${settings.activeCouponBannerCode} 📋</span>` : ''}
      </div>
      <div>
        <a href="https://wa.me/${settings.whatsappNumber}" target="_blank" class="top-vip-support">
          <span class="live-dot"></span>
          <span>خدمة عملاء VIP واتساب: ${settings.whatsappDisplay}</span>
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
      <form class="paris-search-bar" id="searchForm" onsubmit="event.preventDefault(); searchProducts(true);">
        <select id="searchCategory" class="paris-search-scope" onchange="onSearchScopeChange()">
          <option value="">كل الأقسام</option>
          <option value="clothes">👗 قسم الملابس</option>
          <option value="home">🏠 قسم الأدوات المنزلية</option>
          <option value="shoes">👟 قسم الأحذية</option>
        </select>
        <input type="text" id="searchInput" class="paris-search-input" placeholder="ابحث عن الملابس، الأحذية، أدوات المطبخ، الديكور..." autocomplete="off" oninput="searchProducts(false)">
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
            <div class="floating-card-sub" id="heroFloatingLink">خامات أصلية ومعاينة قبل الدفع</div>
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
        <div class="trust-icon-box">💵</div>
        <div>
          <div class="trust-title">دفع كاش عند الاستلام</div>
          <p class="trust-desc">لا تدفع أي مبلغ قبل فتح الشحنة وفحصها بالكامل.</p>
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
        <div class="quickview-main-frame" id="qvMainFrame" onclick="toggleQuickViewZoom()" title="انقر للتكبير والفحص">
          <img id="qvModalImg" src="" alt="">
          <span style="position:absolute; bottom:10px; right:10px; background:rgba(15,51,34,0.85); color:#fff; font-size:11px; padding:4px 10px; border-radius:50px; pointer-events:none;">🔍 اضغط للتكبير</span>
        </div>
        <div class="qv-thumbs-strip" id="qvThumbnailsStrip"></div>
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
        <div id="qvModalStockBadge" style="font-size:12.5px; font-weight:800; margin-bottom:12px;"></div>

        <div id="qvSizesWrap">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div class="qv-selector-title" style="margin-bottom:0;">المقاس المطلوب:</div>
            <button type="button" id="qvSizeGuideBtn" onclick="toggleSizeGuide()" style="background:#eef5f0; border:1px solid #cce3d8; color:var(--paris-forest); font-size:11.5px; font-weight:800; padding:3px 10px; border-radius:50px; cursor:pointer; font-family:inherit;">
              📏 دليل المقاسات الدقيق
            </button>
          </div>
          <div id="qvSizeGuideBox" class="qv-size-guide-box"></div>
          <div class="qv-chips-list" id="qvModalSizesList"></div>
        </div>

        <div id="qvColorsWrap">
          <div class="qv-selector-title">اللون المفضل:</div>
          <div class="qv-chips-list" id="qvModalColorsList"></div>
        </div>

        <div class="qv-highlights-list" id="qvModalHighlights">
          ✨ خامات عالية الجودة ومضمونة 100%<br>
          🚚 شحن سريع مع حق الفحص والمعاينة قبل الاستلام<br>
          💵 الدفع نقداً عند الاستلام بعد المعاينة الكاملة
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
      <!-- Coupon Code Box (Shown only when admin adds active coupons) -->
      <div id="cartCouponBox" style="display:${Object.keys(activeCouponsMap).length > 0 ? 'flex' : 'none'}; gap:8px; margin-bottom:12px;">
        <input type="text" id="cartCouponInput" placeholder="أدخل كود الخصم إن وجد" style="flex:1; padding:8px 12px; border:1.5px solid #ded7c8; border-radius:8px; font-family:inherit; font-size:12.5px; outline:none; text-transform:uppercase;">
        <button type="button" onclick="applyCouponCode()" style="background:var(--paris-forest); color:#fff; border:none; padding:8px 14px; border-radius:8px; font-family:inherit; font-size:12.5px; font-weight:800; cursor:pointer;">تطبيق</button>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:14.5px;">
        <span style="color:var(--paris-text-muted);">المجموع الفرعي:</span>
        <strong id="cartSubtotalVal" style="color:var(--paris-forest); font-size:16px;">0 ج.م</strong>
      </div>
      <div id="cartDiscountRow" style="display:none; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13.5px; color:#b45309; font-weight:800;">
        <span id="cartDiscountLabel">🎟️ خصم كود VIP:</span>
        <span id="cartDiscountVal">-0 ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:13.5px; color:#107c41;">
        <span>الشحن والتوصيل:</span>
        <span id="cartShippingVal">مجاني للطلبات فوق 500 ج.م</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:19px; font-weight:900; color:var(--paris-forest); border-top:1px dashed #ded7c8; padding-top:12px;">
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
        <select id="custGov" onchange="updateCheckoutSummary()" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
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
          <option value="محافظة أخرى">محافظة أخرى / الصعيد</option>
        </select>
      </div>

      <div style="margin-bottom:18px;">
        <label style="display:block; font-size:13px; font-weight:700; margin-bottom:5px;">العنوان بالتفصيل:</label>
        <input type="text" id="custAddress" placeholder="المدينة، الشارع، علامة مميزة" style="width:100%; padding:11px 14px; border:1.5px solid #ded7c8; border-radius:10px; font-family:inherit; font-size:14px; box-sizing:border-box; outline:none;">
      </div>

      <div style="background:#f7f5ef; padding:14px; border-radius:10px; margin-bottom:14px; font-size:14px;">
        <div id="modalDiscountRow" style="display:none; justify-content:space-between; margin-bottom:5px; color:#b45309; font-weight:700;">
          <span>خصم الكود:</span>
          <span id="modalDiscountVal">-0 ج.م</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;">
          <span>الشحن والتوصيل:</span>
          <strong id="modalShippingVal" style="color:#107c41;">مجاني VIP</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span>الإجمالي شامل الشحن:</span>
          <strong id="modalTotalVal" style="color:var(--paris-forest); font-size:17px;">0 ج.م</strong>
        </div>
        <div style="display:flex; justify-content:space-between; color:#107c41; font-weight:700; font-size:12.5px;">
          <span>طريقة الدفع:</span>
          <span>الدفع عند الاستلام بعد المعاينة والفحص</span>
        </div>
      </div>

      <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px 14px; border-radius:10px; margin-bottom:18px; font-size:12.5px; color:#166534; line-height:1.6;">
        🛡️ <strong>ضمان باريس الذهبي للمشتريات:</strong><br>
        • حق الفحص والمعاينة والتجربة الكاملة مع المندوب قبل دفع أي مليم.<br>
        • الدفع نقداً عند الاستلام بعد التأكد التام من مطابقة المنتج وجودته.
      </div>

      <button type="button" class="btn-card-whatsapp-quick" onclick="submitWhatsAppOrder()" style="width:100%; padding:14px; font-size:16px; border-radius:12px;">
        <span>إرسال الطلب عبر واتساب الآن 💬</span>
      </button>
    </div>
  </div>

  <!-- ===================== 9.5 VERIFIED VIP REVIEWS ===================== -->
  <section class="paris-reviews-section" aria-label="تقييمات العملاء الموثقة">
    <div style="text-align:center;">
      <span style="background:var(--paris-gold-light); color:var(--paris-gold); font-size:12px; font-weight:900; padding:4px 14px; border-radius:50px;">⭐ ثقة عملائنا سر استمرارنا</span>
      <h2 class="section-headline" style="justify-content:center; margin-top:10px;">تجارب حقيقية بعد المعاينة والاستلام</h2>
      <p class="section-subhead">آراء عملاء طلبوا منتجاتنا الفاخرة وفحصوها مع المندوب قبل الدفع</p>
    </div>

    <div class="reviews-bento-grid">
      <div class="review-vip-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <div style="font-weight:900; color:var(--paris-forest); font-size:15px;">م. طارق المنصوري</div>
            <div style="font-size:11.5px; color:#107c41; font-weight:700;">✅ طلب موثّق • التجمع الخامس</div>
          </div>
          <div style="color:#f5a623; font-size:14px;">★★★★★</div>
        </div>
        <p style="font-size:13.5px; color:var(--paris-text-muted); line-height:1.7; margin:0;">
          "طلبت البدلة الإيطالية الصوف بـ 9,850 ج.م، وصراحة كنت متردد في البداية، لكن المندوب انتظرني فتحت الشحنة وقست البدلة وتأكدت من الخامة والتفصيل الإيطالي قبل ما أدفع جنيه واحد."
        </p>
      </div>

      <div class="review-vip-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <div style="font-weight:900; color:var(--paris-forest); font-size:15px;">أ. ندى الشريف</div>
            <div style="font-size:11.5px; color:#107c41; font-weight:700;">✅ طلب موثّق • الإسكندرية</div>
          </div>
          <div style="color:#f5a623; font-size:14px;">★★★★★</div>
        </div>
        <p style="font-size:13.5px; color:var(--paris-text-muted); line-height:1.7; margin:0;">
          "طقم الجرانيت الـ 32 قطعة وصلني في ميعاده بكرتونته الأصلية ومعاه شهادة الضمان 5 سنوات، وفحصت كل الحلل مع المندوب، والتوصيل كان سريع ومؤمّن بالكامل!"
        </p>
      </div>

      <div class="review-vip-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <div style="font-weight:900; color:var(--paris-forest); font-size:15px;">د. كريم عبد الرحمن</div>
            <div style="font-size:11.5px; color:#107c41; font-weight:700;">✅ طلب موثّق • الشيخ زايد</div>
          </div>
          <div style="color:#f5a623; font-size:14px;">★★★★★</div>
        </div>
        <p style="font-size:13.5px; color:var(--paris-text-muted); line-height:1.7; margin:0;">
          "الحذاء الأوكسفورد الجلد الطبيعي فخم جداً ومريح للقدم، والتواصل مع خدمة عملاء واتساب كان سريع ومحترم جداً من أول تأكيد المقاس لحد الاستلام."
        </p>
      </div>
    </div>
  </section>

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
          <li>🛡️ فحص وتجربة كاملة قبل الدفع للمندوب</li>
          <li>📞 خط ساخن وخدمة عملاء VIP عبر واتساب</li>
        </ul>
      </div>

      <div>
        <h4 style="color:#ffd875; font-size:1.15rem; margin-bottom:18px; font-weight:800;">طرق الدفع والتواصل</h4>
        <p style="color:#d6e2dc; font-size:14px; line-height:1.7;">نستقبل استفساراتكم وحجوزاتكم طوال أيام الأسبوع 24/7:</p>
        <a href="https://wa.me/${settings.whatsappNumber}" target="_blank" style="display:inline-flex; align-items:center; gap:8px; background:#25d366; color:#fff; padding:12px 24px; border-radius:50px; text-decoration:none; font-weight:800; font-size:14px; margin-top:8px; box-shadow:0 6px 20px rgba(37,211,102,0.3);">
          <span>💬 محادثة فورية واتساب</span>
        </a>
      </div>

    </div>

    <div style="max-width:1320px; margin:45px auto 0; padding-top:24px; border-top:1px solid rgba(255,255,255,0.12); text-align:center; color:#95a59d; font-size:13px;">
      جميع الحقوق محفوظة &copy; 2026 <strong>متجر باريس التجاري (Paris Mall)</strong> | <a href="/login" style="color:#ffd875; text-decoration:none; margin-inline-start:12px;">بوابة المشرفين والأدمن 👤</a>
    </div>
  </footer>

  <!-- WhatsApp Float Button -->
  <a href="https://wa.me/${settings.whatsappNumber}" target="_blank" class="paris-wa-float" style="position:fixed; bottom:25px; left:25px; width:60px; height:60px; background:#25d366; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 25px rgba(37,211,102,0.45); z-index:9999; color:#fff; text-decoration:none; transition:all 0.3s;" aria-label="تواصل واتساب">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.077-1.118-.056-.277-.088-.636-.217-1.096-.416-1.936-.838-3.195-2.798-3.292-2.927-.098-.129-.785-1.045-.785-1.993 0-.948.497-1.414.674-1.606.177-.193.385-.241.513-.241.129 0 .257.002.369.006.118.005.276-.045.432.329.16.386.546 1.332.594 1.43.048.097.08.21.016.339-.064.13-.097.21-.193.322-.096.113-.203.252-.29.339-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.33.736.655 1.357.858 1.55.954.193.096.305.08.418-.049.112-.128.481-.561.61-.754.128-.193.257-.161.433-.096.177.064 1.123.53 1.316.626.193.097.321.145.369.226.048.08.048.466-.096.871z"/></svg>
  </a>

  <!-- Products & Budget Chatbot Widget -->
  <button type="button" class="paris-bot-toggle" id="parisBotToggleBtn" onclick="toggleParisChatbot()">
    <span>🤖</span>
    <span>مساعد الميزانية والمنتجات</span>
  </button>

  <div class="paris-bot-window" id="parisChatbotWindow" role="dialog" aria-label="مساعد الميزانية والمنتجات">
    <div class="paris-bot-header">
      <div>
        <div style="font-weight:900; font-size:14.5px;">🤖 مساعد المنتجات والميزانية</div>
        <div style="font-size:11px; color:#d4e0d9;">اكتب ميزانيتك أو اسم المنتج لعرض المتاح فوراً</div>
      </div>
      <button type="button" onclick="toggleParisChatbot()" style="background:rgba(255,255,255,0.18); color:#fff; border:none; width:30px; height:30px; border-radius:50%; font-size:18px; cursor:pointer;">&times;</button>
    </div>

    <div class="paris-bot-messages" id="parisBotMessages">
      <div class="bot-msg">
        أهلاً بك في <strong>متجر باريس</strong>! 👋<br>
        أنا هنا لمساعدتك في اختيار المنتج المناسب لميزانيتك من المتاح بالمخزن حالياً.<br>
        <strong>اكتب رقم ميزانيتك</strong> (مثلاً: <code>1500</code> أو <code>10000</code>) أو اسم المنتج، أو اختر من الأزرار بالأسفل:
      </div>
    </div>

    <div class="bot-quick-row">
      <button type="button" class="bot-chip" onclick="sendBotQuery('تحت 500')">💰 تحت 500</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('حتى 1000')">💰 حتى 1,000</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('حتى 3000')">💰 حتى 3,000</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('حتى 10500')">💰 حتى 10,500</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('ملابس')">👗 ملابس</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('أدوات منزلية')">🏠 منزل</button>
      <button type="button" class="bot-chip" onclick="sendBotQuery('أحذية')">👟 أحذية</button>
    </div>

    <form class="paris-bot-input-bar" onsubmit="event.preventDefault(); sendBotFromInput();">
      <input type="text" id="parisBotInput" placeholder="اكتب ميزانيتك (مثلاً 2000) أو اسم المنتج..." autocomplete="off" style="flex:1; padding:9px 12px; border:1.5px solid #ded7c8; border-radius:50px; font-family:inherit; font-size:13px; outline:none;">
      <button type="submit" style="background:var(--paris-forest); color:#fff; border:none; padding:9px 16px; border-radius:50px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer;">إرسال</button>
    </form>
  </div>

  <!-- Toast -->
  <div class="paris-toast" id="parisToast">
    <span>✅</span>
    <span id="toastMsg">تمت الإضافة بنجاح</span>
  </div>

  <!-- Client-side Script -->
  <script>
    const productsData = ${JSON.stringify(publishedProducts)};
    const PARIS_COUPONS = ${JSON.stringify(activeCouponsMap)};
    const PARIS_SHIPPING = ${JSON.stringify(settings.shipping)};
    const PARIS_INSTALLMENTS = ${JSON.stringify(settings.installments)};
    const PARIS_WHATSAPP = ${JSON.stringify(settings.whatsappNumber)};
    let cart = [];
    let wishlistItems = [];
    let appliedCoupon = null;
    try {
      cart = JSON.parse(localStorage.getItem('paris_cart_v2') || '[]');
      wishlistItems = JSON.parse(localStorage.getItem('paris_wishlist_v2') || '[]');
      const savedCode = localStorage.getItem('paris_coupon_v2');
      if (savedCode && PARIS_COUPONS[savedCode]) appliedCoupon = savedCode;
    } catch (e) {}

    let currentMall = 'clothes';
    let currentFilter = 'all';
    let selectedQvProduct = null;
    let selectedQvSize = '';
    let selectedQvColor = '';

    // Marketing Pixels Dispatcher (Meta / TikTok / Google Analytics Ready)
    window.trackParisEvent = function(eventName, payload) {
      try {
        if (typeof window.fbq === 'function') window.fbq('track', eventName, payload || {});
        if (typeof window.ttq !== 'undefined' && typeof window.ttq.track === 'function') window.ttq.track(eventName, payload || {});
        if (typeof window.gtag === 'function') window.gtag('event', eventName, payload || {});
      } catch (e) {}
    };

    function persistCartState() {
      try {
        localStorage.setItem('paris_cart_v2', JSON.stringify(cart));
        if (appliedCoupon) localStorage.setItem('paris_coupon_v2', appliedCoupon);
        else localStorage.removeItem('paris_coupon_v2');
      } catch (e) {}
    }

    function getShippingFee(gov, subtotalAfterDiscount) {
      if (subtotalAfterDiscount >= PARIS_SHIPPING.freeThreshold || subtotalAfterDiscount === 0) return 0;
      if (['القاهرة', 'الجيزة', 'القليوبية'].includes(gov)) return PARIS_SHIPPING.cairoFee;
      if (['الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس'].includes(gov)) return PARIS_SHIPPING.deltaFee;
      return PARIS_SHIPPING.otherFee;
    }

    function getCartTotals() {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const couponObj = appliedCoupon ? PARIS_COUPONS[appliedCoupon] : null;
      const discount = couponObj ? Math.round(subtotal * couponObj.rate) : 0;
      const net = Math.max(0, subtotal - discount);
      const govEl = document.getElementById('custGov');
      const gov = govEl ? govEl.value : 'القاهرة';
      const shipping = getShippingFee(gov, net);
      return { subtotal, discount, net, shipping, total: net + shipping, couponObj, gov };
    }

    function formatPrice(val) {
      if (val === undefined || val === null || isNaN(val)) return '0';
      return Number(val).toLocaleString('en-US');
    }

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
      updateCheckoutSummary();
      checkoutModal.style.display = 'flex';
      window.trackParisEvent('InitiateCheckout', { value: getCartTotals().total, currency: 'EGP', num_items: cart.length });
    });

    function updateCheckoutSummary() {
      const t = getCartTotals();
      const modalDiscRow = document.getElementById('modalDiscountRow');
      const modalDiscVal = document.getElementById('modalDiscountVal');
      const modalShipVal = document.getElementById('modalShippingVal');
      const modalTotalVal = document.getElementById('modalTotalVal');
      if (modalDiscRow && modalDiscVal) {
        if (t.discount > 0) {
          modalDiscRow.style.display = 'flex';
          modalDiscVal.innerText = '-' + formatPrice(t.discount) + ' ج.م (' + appliedCoupon + ')';
        } else {
          modalDiscRow.style.display = 'none';
        }
      }
      if (modalShipVal) {
        modalShipVal.innerText = t.shipping === 0
          ? (t.net >= PARIS_SHIPPING.vipThreshold ? 'مجاني VIP ومؤمّن بالكامل 🛡️' : 'مجاني 🎉')
          : formatPrice(t.shipping) + ' ج.م (' + t.gov + ')';
      }
      if (modalTotalVal) modalTotalVal.innerText = formatPrice(t.total) + ' ج.م';
    }

    document.getElementById('modalCloseBtn').addEventListener('click', () => {
      checkoutModal.style.display = 'none';
    });

    function showToast(msg) {
      toastMsg.innerText = msg;
      parisToast.style.display = 'flex';
      setTimeout(() => { parisToast.style.display = 'none'; }, 2600);
    }

    function copyCouponCode(code) {
      navigator.clipboard.writeText(code).catch(() => {});
      const clean = (code || '').trim().toUpperCase();
      if (PARIS_COUPONS[clean]) {
        appliedCoupon = clean;
        const inp = document.getElementById('cartCouponInput');
        if (inp) inp.value = clean;
        persistCartState();
        renderCart();
        showToast('🎉 تم نسخ وتفعيل كود الخصم: ' + clean);
      } else {
        showToast('تم نسخ كود الخصم: ' + code);
      }
    }

    function applyCouponCode() {
      const inp = document.getElementById('cartCouponInput');
      const code = (inp ? inp.value : '').trim().toUpperCase();
      if (!code) {
        appliedCoupon = null;
        persistCartState();
        renderCart();
        return;
      }
      if (PARIS_COUPONS[code]) {
        appliedCoupon = code;
        persistCartState();
        renderCart();
        showToast('✅ تم تطبيق ' + PARIS_COUPONS[code].label + ' بنجاح!');
      } else {
        showToast('❌ كود الخصم غير صحيح أو غير مفعل');
      }
    }

    function toggleWishlist(btn, title) {
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        if (!wishlistItems.includes(title)) wishlistItems.push(title);
        showToast('تمت إضافة "' + title.substring(0, 18) + '..." للمفضلة ❤️');
      } else {
        wishlistItems = wishlistItems.filter(t => t !== title);
        showToast('تمت الإزالة من المفضلة');
      }
      try { localStorage.setItem('paris_wishlist_v2', JSON.stringify(wishlistItems)); } catch (e) {}
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

    function getProductStock(id, title) {
      const prod = productsData.find(p => (id && p.id === id) || (title && p.title === title));
      if (!prod || prod.stock === undefined || prod.stock === null || isNaN(Number(prod.stock))) return 10;
      return Math.max(0, Number(prod.stock));
    }

    function addToCart(title, price, img, size, prodId) {
      const prod = productsData.find(p => (prodId && p.id === prodId) || p.title === title);
      const id = prod ? prod.id : prodId;
      const maxStock = getProductStock(id, title);

      if (maxStock <= 0) {
        showToast('🚫 عذراً، نفدت كمية هذا المنتج حالياً!');
        return;
      }

      const totalForProd = cart.filter(item => (id && item.id === id) || item.title === title).reduce((s, i) => s + i.qty, 0);
      if (totalForProd + 1 > maxStock) {
        showToast('⚠️ عذراً، أقصى كمية متوفرة من هذا المنتج هي ' + maxStock + ' قطعة!');
        return;
      }

      const existing = cart.find(item => item.title === title && item.size === size);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, title, price, img, size: size || '', qty: 1 });
      }
      persistCartState();
      updateCartBadge();
      window.trackParisEvent('AddToCart', { content_name: title, value: price, currency: 'EGP' });
      showToast('تمت إضافة "' + title.substring(0, 20) + '..." إلى السلة 🛍️');
      openCart();
    }

    function updateCartBadge() {
      const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
      headerCartCount.innerText = totalItems;
      cartHeaderBadge.innerText = totalItems;
    }

    function updateQty(index, delta) {
      if (delta > 0) {
        const item = cart[index];
        const maxStock = getProductStock(item.id, item.title);
        const totalForProd = cart.filter(x => (item.id && x.id === item.id) || x.title === item.title).reduce((s, i) => s + i.qty, 0);
        if (totalForProd + delta > maxStock) {
          showToast('⚠️ أقصى كمية متوفرة بالمخزن هي ' + maxStock + ' قطعة!');
          return;
        }
      }
      cart[index].qty += delta;
      if (cart[index].qty <= 0) cart.splice(index, 1);
      persistCartState();
      updateCartBadge();
      renderCart();
    }

    function removeItem(index) {
      cart.splice(index, 1);
      persistCartState();
      updateCartBadge();
      renderCart();
    }

    function renderCart() {
      const discRow = document.getElementById('cartDiscountRow');
      const discLabel = document.getElementById('cartDiscountLabel');
      const discVal = document.getElementById('cartDiscountVal');
      const shipVal = document.getElementById('cartShippingVal');

      if (cart.length === 0) {
        cartEmptyState.style.display = 'block';
        cartItemsList.style.display = 'none';
        cartSubtotalVal.innerText = '0 ج.م';
        cartTotalVal.innerText = '0 ج.م';
        if (discRow) discRow.style.display = 'none';
        if (shipVal) shipVal.innerText = 'مجاني للطلبات فوق 500 ج.م';
        shippingProgressFill.style.width = '0%';
        freeShippingText.innerText = '🚚 أضف بـ 500 ج.م للحصول على شحن مجاني!';
        return;
      }

      cartEmptyState.style.display = 'none';
      cartItemsList.style.display = 'block';

      let html = '';

      cart.forEach((item, idx) => {
        html += \`
          <div style="display:flex; gap:14px; padding:14px 0; border-bottom:1px solid #eee; align-items:center;">
            <img src="\${item.img}" style="width:64px; height:64px; object-fit:cover; border-radius:10px; border:1px solid #e0dbce;">
            <div style="flex:1;">
              <h5 style="margin:0 0 4px; font-size:14px; font-weight:800; color:var(--paris-forest); line-height:1.3;">\${item.title}</h5>
              \${item.size ? \`<span style="font-size:11px; background:#f0ece3; color:#133e29; padding:1px 6px; border-radius:4px; font-weight:700;">مقاس: \${item.size}</span>\` : ''}
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span style="font-weight:900; color:var(--paris-forest); font-size:15px;">\${formatPrice(item.price)} ج.م</span>
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

      const t = getCartTotals();
      cartItemsList.innerHTML = html;
      cartSubtotalVal.innerText = formatPrice(t.subtotal) + ' ج.م';
      if (discRow && discLabel && discVal) {
        if (t.discount > 0 && t.couponObj) {
          discRow.style.display = 'flex';
          discLabel.innerText = '🎟️ ' + t.couponObj.label + ' (' + appliedCoupon + '):';
          discVal.innerText = '-' + formatPrice(t.discount) + ' ج.م';
        } else {
          discRow.style.display = 'none';
        }
      }
      if (shipVal) {
        shipVal.innerText = t.shipping === 0
          ? (t.net >= PARIS_SHIPPING.vipThreshold ? 'شحن VIP مجاني مؤمّن 🛡️' : 'شحن مجاني 🎉')
          : formatPrice(t.shipping) + ' ج.م (حسب المحافظة)';
      }
      cartTotalVal.innerText = formatPrice(t.total) + ' ج.م';

      // Free shipping progress
      const targetFree = PARIS_SHIPPING.freeThreshold;
      if (t.net >= targetFree) {
        shippingProgressFill.style.width = '100%';
        freeShippingText.innerHTML = t.net >= PARIS_SHIPPING.vipThreshold
          ? '👑 <strong>طلب VIP!</strong> شحن مجاني مؤمّن + أولوية فحص ومعاينة مع المندوب!'
          : '🎉 <strong>مبروك!</strong> لقد حصلت على شحن مجاني لطلبك!';
      } else {
        const remaining = targetFree - t.net;
        const pct = Math.min(100, Math.round((t.net / targetFree) * 100));
        shippingProgressFill.style.width = pct + '%';
        freeShippingText.innerText = '🚚 أضف بـ ' + formatPrice(remaining) + ' ج.م إضافية للحصول على شحن مجاني!';
      }
    }

    function quickOrderWhatsApp(title, price) {
      window.trackParisEvent('InitiateCheckout', { content_name: title, value: price, currency: 'EGP' });
      const msg = 'مرحباً متجر باريس 👋%0Aأود الاستفسار وحجز هذا المنتج فوراً:%0A' +
                  '• *المنتج:* ' + encodeURIComponent(title) + '%0A' +
                  '• *السعر:* ' + formatPrice(price) + ' ج.م%0A' +
                  '• *الدفع:* الدفع نقداً عند الاستلام بعد المعاينة والفحص مع المندوب 🛡️%0A%0A' +
                  'يرجى تأكيد التوافر وتفاصيل الشحن.';
      window.open('https://wa.me/' + PARIS_WHATSAPP + '?text=' + msg, '_blank');
    }

    function notifyRestockWhatsApp(title) {
      const msg = 'مرحباً متجر باريس 👋%0Aأرغب في إشعاري فور توفر هذا المنتج من جديد:%0A• *المنتج:* ' + encodeURIComponent(title);
      window.open('https://wa.me/' + PARIS_WHATSAPP + '?text=' + msg, '_blank');
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

      const t = getCartTotals();
      let itemsText = '';
      cart.forEach((item, i) => {
        itemsText += (i+1) + '. ' + item.title + (item.size ? ' [مقاس: ' + item.size + ']' : '') + ' (الكمية: ' + item.qty + ') - ' + formatPrice(item.price * item.qty) + ' ج.م%0A';
      });

      const discountLine = t.discount > 0 ? ('*كود الخصم (' + appliedCoupon + '):* -' + formatPrice(t.discount) + ' ج.م%0A') : '';
      const shippingLine = '*مصاريف الشحن:* ' + (t.shipping === 0 ? 'مجاني VIP 🚚' : formatPrice(t.shipping) + ' ج.م') + '%0A';

      const orderMsg = '🛍️ *طلب شراء رسمي من متجر باريس (VIP Order)* 🛍️%0A%0A' +
                       '*بيانات العميل:*%0A' +
                       '• الاسم: ' + encodeURIComponent(name) + '%0A' +
                       '• الهاتف: ' + encodeURIComponent(phone) + '%0A' +
                       '• المحافظة: ' + encodeURIComponent(gov) + '%0A' +
                       '• العنوان: ' + encodeURIComponent(addr) + '%0A%0A' +
                       '*تفاصيل المنتجات:*%0A' + itemsText + '%0A' +
                       discountLine +
                       shippingLine +
                       '*إجمالي الفاتورة النهائي:* ' + formatPrice(t.total) + ' ج.م%0A' +
                       '*طريقة الدفع:* الدفع نقداً عند الاستلام بعد المعاينة والفحص التام 🛡️%0A%0A' +
                       'يرجى تأكيد تجهيز الشحنة والتوصيل.';

      window.trackParisEvent('Purchase', { value: t.total, currency: 'EGP' });
      // Auto-decrement inventory stock on server if available
      fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(i => ({ id: i.id, title: i.title, qty: i.qty })) })
      }).catch(() => {});

      window.open('https://wa.me/' + PARIS_WHATSAPP + '?text=' + orderMsg, '_blank');
      checkoutModal.style.display = 'none';
      cart = [];
      appliedCoupon = null;
      persistCartState();
      updateCartBadge();
      renderCart();
      showToast('تم إرسال طلبك بنجاح عبر واتساب!');
    }

    // Quick View Modal + Multi-Image Gallery + Zoom + Size Guide
    function openQuickView(productId) {
      const prod = productsData.find(p => p.id === productId);
      if (!prod) return;
      selectedQvProduct = prod;

      window.trackParisEvent('ViewContent', { content_name: prod.title, value: prod.price, currency: 'EGP' });

      const mainFrame = document.getElementById('qvMainFrame');
      if (mainFrame) mainFrame.classList.remove('zoomed');
      document.getElementById('qvModalImg').src = prod.image || '';

      // Render multi-image gallery thumbnails if available
      const allImgs = [prod.image, ...(Array.isArray(prod.gallery) ? prod.gallery : [])].filter(Boolean);
      const uniqueImgs = Array.from(new Set(allImgs));
      const thumbsStrip = document.getElementById('qvThumbnailsStrip');
      if (thumbsStrip) {
        if (uniqueImgs.length > 1) {
          thumbsStrip.style.display = 'flex';
          thumbsStrip.innerHTML = uniqueImgs.map((u, idx) => \`
            <button type="button" class="qv-thumb-btn \${idx === 0 ? 'active' : ''}" onclick="switchQuickViewImage(this, '\${u}')">
              <img src="\${u}" alt="">
            </button>
          \`).join('');
        } else {
          thumbsStrip.style.display = 'none';
          thumbsStrip.innerHTML = '';
        }
      }

      document.getElementById('qvModalTitle').innerText = prod.title;
      document.getElementById('qvModalPrice').innerText = formatPrice(prod.price) + ' ج.م';
      document.getElementById('qvModalOldPrice').innerText = (prod.regularPrice && prod.regularPrice > prod.price) ? (formatPrice(prod.regularPrice) + ' ج.م') : '';
      
      const qvStockVal = getProductStock(prod.id, prod.title);
      const qvStockBadge = document.getElementById('qvModalStockBadge');
      const qvAddBtn = document.getElementById('qvAddToCartBtn');
      if (qvStockBadge) {
        if (qvStockVal <= 0) {
          qvStockBadge.innerHTML = '<span style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; padding:3px 10px; border-radius:6px;">🚫 نفدت الكمية حالياً</span>';
        } else if (qvStockVal <= 3) {
          qvStockBadge.innerHTML = '<span style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; padding:3px 10px; border-radius:6px;">🔥 كمية محدودة جداً — متبقي ' + qvStockVal + ' قطع فقط!</span>';
        } else {
          qvStockBadge.innerHTML = '<span style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; padding:3px 10px; border-radius:6px;">✓ متوفر بالمخزن (' + qvStockVal + ' قطعة)</span>';
        }
      }
      if (qvAddBtn) {
        if (qvStockVal <= 0) {
          qvAddBtn.style.background = '#9ca3af';
          qvAddBtn.style.cursor = 'not-allowed';
          qvAddBtn.innerHTML = '<span>نفدت الكمية 🚫</span>';
        } else {
          qvAddBtn.style.background = '';
          qvAddBtn.style.cursor = '';
          qvAddBtn.innerHTML = '<span>أضف إلى السلة 🛒</span>';
        }
      }

      let deptName = 'قسم الأدوات المنزلية';
      if (prod.mall === 'clothes') deptName = 'قسم الأزياء والملابس';
      if (prod.mall === 'shoes') deptName = 'قسم الأحذية والرياضة';
      document.getElementById('qvModalDept').innerText = deptName;

      // Reset size guide box when opening
      const sgBox = document.getElementById('qvSizeGuideBox');
      if (sgBox) sgBox.style.display = 'none';

      // High-Ticket Features in Highlights (Cash on Delivery after full inspection — NO installments/returns)
      const isHigh = prod.price >= 1000;
      const highHighlights = isHigh
        ? \`<div style="color:#b45309; font-weight:800; margin-bottom:5px;">🛡️ حق المعاينة والفحص والتجربة الكاملة مع المندوب قبل دفع أي مليم</div>
           <div>💵 الدفع نقداً عند الاستلام فقط بعد التأكد من مطابقة المنتج</div>
           <div>💎 خامات أصلية وتغليف فاخر + شحن سريع مؤمّن</div>\`
        : \`✨ خامات عالية الجودة ومضمونة 100%<br>
           🚚 شحن سريع مع حق الفحص والمعاينة قبل الاستلام<br>
           💵 الدفع نقداً عند الاستلام بعد المعاينة\`;
      document.getElementById('qvModalHighlights').innerHTML = highHighlights;

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
        const beforeLen = cart.length;
        addToCart(prod.title, prod.price, prod.image, selectedQvSize, prod.id);
        if (getProductStock(prod.id, prod.title) > 0) closeQuickView();
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

    function switchQuickViewImage(btn, url) {
      document.querySelectorAll('#qvThumbnailsStrip .qv-thumb-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      const imgEl = document.getElementById('qvModalImg');
      if (imgEl) imgEl.src = url;
      const frame = document.getElementById('qvMainFrame');
      if (frame) frame.classList.remove('zoomed');
    }

    function toggleQuickViewZoom() {
      const frame = document.getElementById('qvMainFrame');
      if (frame) frame.classList.toggle('zoomed');
    }

    function toggleSizeGuide() {
      const box = document.getElementById('qvSizeGuideBox');
      if (!box) return;
      if (box.style.display === 'block') {
        box.style.display = 'none';
        return;
      }
      const isShoes = selectedQvProduct && selectedQvProduct.mall === 'shoes';
      if (isShoes) {
        box.innerHTML = '<strong>📏 دليل مقاسات الأحذية الدقيق (سم):</strong>' +
          '<table class="qv-size-guide-table"><tr><th>المقاس</th><th>40</th><th>41</th><th>42</th><th>43</th><th>44</th><th>45</th></tr>' +
          '<tr><td>طول القدم (سم)</td><td>25.5</td><td>26</td><td>26.5</td><td>27.5</td><td>28</td><td>29</td></tr></table>';
      } else {
        box.innerHTML = '<strong>📏 دليل مقاسات الملابس والبدل:</strong>' +
          '<table class="qv-size-guide-table"><tr><th>المقاس</th><th>S / 48</th><th>M / 50</th><th>L / 52</th><th>XL / 54</th><th>2XL / 56</th></tr>' +
          '<tr><td>الوزن المناسب</td><td>55-65 كجم</td><td>65-75 كجم</td><td>75-85 كجم</td><td>85-95 كجم</td><td>95-110 كجم</td></tr></table>';
      }
      box.style.display = 'block';
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

    function searchProducts(shouldScroll = false) {
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
      if (shouldScroll) scrollToProducts();
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

    // ===================== PRODUCTS & BUDGET CHATBOT ENGINE =====================
    function toggleParisChatbot() {
      const win = document.getElementById('parisChatbotWindow');
      if (!win) return;
      const isOpen = win.style.display === 'flex';
      win.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        const inp = document.getElementById('parisBotInput');
        if (inp) setTimeout(() => inp.focus(), 100);
      }
    }

    function sendBotFromInput() {
      const inp = document.getElementById('parisBotInput');
      if (!inp) return;
      const txt = inp.value.trim();
      if (!txt) return;
      inp.value = '';
      sendBotQuery(txt);
    }

    function normalizeBotDigits(str) {
      return String(str || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    }

    function escapeBotHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function botAddToCart(pid) {
      const p = productsData.find(item => item.id === pid);
      if (!p) return;
      const defaultSize = (p.sizes && p.sizes.length) ? p.sizes[0] : '';
      addToCart(p.title, p.price, p.image || '', defaultSize, p.id);
    }

    function renderBotProductCard(p) {
      const stk = getProductStock(p.id, p.title);
      const safeT = escapeBotHtml(p.title);
      return '<div class="bot-prod-mini">' +
        '<img src="' + escapeBotHtml(p.image || '') + '" alt="">' +
        '<div style="flex:1; min-width:0;">' +
          '<div style="font-weight:800; font-size:12px; color:var(--paris-forest); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + safeT + '</div>' +
          '<div style="display:flex; align-items:center; gap:6px; margin-top:2px;">' +
            '<strong style="font-size:12.5px; color:#0d5c3a;">' + formatPrice(p.price) + ' ج.م</strong>' +
            '<span style="font-size:10.5px; color:#15803d;">(متوفر ' + stk + ')</span>' +
          '</div>' +
          '<div style="display:flex; gap:6px; margin-top:5px;">' +
            '<button type="button" onclick="openQuickView(' + p.id + ')" style="background:#f4f1ea; border:1px solid #d5cebe; color:var(--paris-forest); padding:3px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; font-family:inherit;">عرض التفاصيل</button>' +
            '<button type="button" onclick="botAddToCart(' + p.id + ')" style="background:var(--paris-forest); border:none; color:#fff; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; font-family:inherit;">+ أضف للسلة</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function normalizeBotArabic(str) {
      return String(str || '')
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[\\u064B-\\u065F\\u0670]/g, '')
        .toLowerCase();
    }

    const BOT_STOP_WORDS = new Set([
      'عندكم', 'عندك', 'عندكوا', 'عاوز', 'عايز', 'عاوزين', 'عايزين', 'عاوزلي', 'عايزلي',
      'محتاج', 'محتاجين', 'معاي', 'معايا', 'معي', 'بمبلغ', 'بميزانيه', 'يجيبولي', 'يجيبوا',
      'ابحث', 'دور', 'عن', 'في', 'فيه', 'فيها', 'من', 'بكام', 'بكم', 'سعر', 'اسعار',
      'لو', 'سمحت', 'سمحتي', 'ممكن', 'انا', 'احنا', 'منتج', 'منتجات', 'قسم', 'مول',
      'حاجه', 'حاجات', 'شويه', 'اي', 'ايه', 'تحت', 'اقل', 'حتي', 'فوق', 'اعلي', 'اكثر',
      'بين', 'الي', 'جنيه', 'جم', 'مصري', 'قولي', 'هات', 'هاتلي', 'وريني', 'اريد', 'نريد',
      'متوفر', 'متاح', 'موجود', 'كاش', 'ميزانيه', 'ميزانيتي', 'بحدود', 'حدود', 'تقريبا',
      'يعني', 'بس', 'او', 'علي', 'قد', 'اللي', 'عندنا', 'دي', 'ده', 'دول', 'اشتري'
    ]);

    const BOT_DEPT_WORDS = new Set(['ملابس', 'هدوم', 'ازياء', 'منزل', 'منزليه', 'ادوات', 'مطبخ', 'احذيه', 'شوز', 'شوزات', 'جزم', 'جزمه']);

    const BOT_MODIFIER_KEYS = new Set([
      'رجالي', 'رجال', 'شبابي', 'حريمي', 'نسائي', 'نسائيه', 'بناتي',
      'اطفال', 'طفل', 'ولادي', 'كلاسيك', 'رياضي', 'رياضيه', 'كاجوال', 'صيفي', 'شتوي', 'قطن', 'جلد'
    ]);

    const BOT_SYNONYMS = {
      'بنطلون': ['بنطلون', 'جينز'],
      'بناطيل': ['بنطلون', 'جينز'],
      'بنطلونات': ['بنطلون', 'جينز'],
      'بنطال': ['بنطلون', 'جينز'],
      'جينز': ['جينز', 'بنطلون'],
      'شروال': ['بنطلون'],
      'سروال': ['بنطلون'],
      'بدله': ['بدله'],
      'بدل': ['بدله', 'بدل'],
      'بليزر': ['بدله'],
      'قميص': ['قميص'],
      'قمصان': ['قميص'],
      'شميز': ['قميص'],
      'شيميز': ['قميص'],
      'تيشيرت': ['تيشيرت'],
      'تيشيرتات': ['تيشيرت'],
      'تشيرت': ['تيشيرت'],
      'تشيرتات': ['تيشيرت'],
      'تيشرت': ['تيشيرت'],
      'فستان': ['فستان'],
      'فساتين': ['فستان'],
      'دريس': ['فستان'],
      'دريسات': ['فستان'],
      'كارديجان': ['كارديجان'],
      'كرديجان': ['كارديجان'],
      'سويت': ['سويت شيرت'],
      'شيرت': ['سويت شيرت', 'تيشيرت'],
      'هودي': ['سويت شيرت'],
      'بلوفر': ['كارديجان', 'سويت شيرت'],
      'جاكيت': ['جاكيت', 'كارديجان', 'سويت شيرت'],
      'جاكيتات': ['جاكيت', 'كارديجان', 'سويت شيرت'],
      'بلوزه': ['بلوز'],
      'بلوزات': ['بلوز'],
      'بيجاما': ['بيجام', 'نوم'],
      'بيجامه': ['بيجام', 'نوم'],
      'بيجامات': ['بيجام', 'نوم'],
      'بجامه': ['بيجام', 'نوم'],
      'ترينج': ['بيجام', 'نوم'],
      'سنيكرز': ['سنيكرز'],
      'كوتشي': ['سنيكرز', 'رياضي'],
      'كوتشيات': ['سنيكرز', 'رياضي'],
      'فلات': ['فلات'],
      'اوكسفورد': ['اوكسفورد'],
      'كلاسيك': ['كلاسيك'],
      'رياضي': ['رياضي', 'سنيكرز'],
      'رياضيه': ['رياضي', 'سنيكرز'],
      'رجالي': ['رجالي', 'رجاليه'],
      'رجال': ['رجالي', 'رجاليه'],
      'شبابي': ['رجالي'],
      'حريمي': ['حريمي', 'نسائي', 'نسائيه'],
      'نسائي': ['حريمي', 'نسائي', 'نسائيه'],
      'نسائيه': ['حريمي', 'نسائي', 'نسائيه'],
      'بناتي': ['حريمي', 'نسائي', 'اطفال'],
      'اطفال': ['اطفال'],
      'طفل': ['اطفال'],
      'ولادي': ['اطفال', 'رجالي'],
      'حلل': ['جرانيت', 'طهي'],
      'حله': ['جرانيت', 'طهي'],
      'جرانيت': ['جرانيت'],
      'تيفال': ['تيفال', 'جرانيت'],
      'طهي': ['طهي', 'جرانيت'],
      'مقالي': ['مقالي'],
      'طاسه': ['مقالي'],
      'طاسات': ['مقالي'],
      'سكاكين': ['سكاكين'],
      'سكين': ['سكاكين'],
      'سكينه': ['سكاكين'],
      'توابل': ['توابل'],
      'بهارات': ['توابل'],
      'برطمان': ['برطمان'],
      'برطمانات': ['برطمان'],
      'مفروشات': ['مفروشات'],
      'ملايه': ['مفروشات', 'سرير'],
      'ملايات': ['مفروشات', 'سرير'],
      'سرير': ['سرير', 'مفروشات'],
      'بطانيه': ['بطاني'],
      'بطانيات': ['بطاني'],
      'كوفرته': ['بطاني', 'مفروشات'],
      'مناشف': ['مناشف'],
      'منشفه': ['مناشف'],
      'فوط': ['مناشف'],
      'فوطه': ['مناشف'],
      'منظم': ['منظم', 'تنظيم'],
      'منظمات': ['منظم', 'تنظيم'],
      'تنظيم': ['تنظيم', 'منظم'],
      'تخزين': ['تخزين', 'منظم'],
      'صندوق': ['صندوق'],
      'صناديق': ['صندوق'],
      'ادراج': ['ادراج'],
      'لوحات': ['لوحات', 'اطارات'],
      'لوحه': ['لوحات', 'اطارات'],
      'اطارات': ['اطارات', 'لوحات'],
      'اباجوره': ['اباجور'],
      'اباجور': ['اباجور'],
      'اضاءه': ['اباجور', 'اضاءه'],
      'ديكور': ['ديكور', 'لوحات', 'اباجور'],
      'طقم': ['طقم'],
      'اطقم': ['طقم'],
      'قطن': ['قطن'],
      'جلد': ['جلد']
    };

    function parseBotTokens(normText, excludeDeptWords) {
      const cleaned = normText.replace(/[^\\u0621-\\u064A0-9 ]/g, ' ');
      const rawTokens = cleaned.split(/ +/).filter(Boolean);
      const itemGroups = [];
      const modifierGroups = [];
      for (let i = 0; i < rawTokens.length; i++) {
        let tok = rawTokens[i];
        if (/^[0-9]+$/.test(tok)) continue;
        if (BOT_STOP_WORDS.has(tok)) continue;
        // Strip leading Arabic conjunction 'و' (and) if token isn't already a known root/stopword
        if (!BOT_SYNONYMS[tok] && !BOT_DEPT_WORDS.has(tok) && tok.startsWith('و') && tok.length > 3) {
          const withoutWaw = tok.slice(1);
          const wawBase = (withoutWaw.length > 3 && withoutWaw.startsWith('ال')) ? withoutWaw.slice(2) : withoutWaw;
          if (BOT_STOP_WORDS.has(withoutWaw) || BOT_STOP_WORDS.has(wawBase)) continue;
          tok = withoutWaw;
        }
        let base = (tok.length > 3 && tok.startsWith('ال')) ? tok.slice(2) : tok;
        if (BOT_STOP_WORDS.has(base)) continue;
        if (excludeDeptWords && (BOT_DEPT_WORDS.has(tok) || BOT_DEPT_WORDS.has(base))) continue;
        if (base.length < 2) continue;
        const syns = BOT_SYNONYMS[tok] || BOT_SYNONYMS[base] || [base];
        if (BOT_MODIFIER_KEYS.has(tok) || BOT_MODIFIER_KEYS.has(base)) {
          modifierGroups.push(syns);
        } else {
          itemGroups.push({ key: base, syns });
        }
      }
      return { itemGroups, modifierGroups };
    }

    function filterProductsByBotGroups(pool, groups) {
      if (!groups || groups.length === 0) return pool;
      return pool.filter(p => {
        const hay = normalizeBotArabic((p.title || '') + ' ' + (p.chip || '') + ' ' + (p.category || ''));
        return groups.every(syns => syns.some(term => hay.includes(term)));
      });
    }

    function buildComboMatches(pool, parsed, maxTotalBudget) {
      const modSyns = parsed.modifierGroups || [];
      const perItemBuckets = [];
      for (const ig of parsed.itemGroups) {
        let matches = filterProductsByBotGroups(pool, [ig.syns, ...modSyns]);
        if (matches.length === 0 && modSyns.length > 0) {
          matches = filterProductsByBotGroups(pool, [ig.syns]);
        }
        if (maxTotalBudget) {
          matches = matches.filter(p => p.price <= maxTotalBudget);
        }
        matches.sort((a, b) => a.price - b.price);
        if (matches.length > 0) perItemBuckets.push({ key: ig.key, items: matches });
      }
      if (perItemBuckets.length === 0) return { combined: [], sumMin: 0 };
      const pickedIds = new Set();
      const combined = [];
      let sumMin = 0;
      for (const bucket of perItemBuckets) {
        sumMin += bucket.items[0].price;
        for (const it of bucket.items.slice(0, 3)) {
          if (!pickedIds.has(it.id)) {
            pickedIds.add(it.id);
            combined.push(it);
          }
        }
      }
      if (maxTotalBudget && sumMin > maxTotalBudget) {
        return { combined: [], sumMin, overBudget: true };
      }
      return { combined, sumMin, bucketCount: perItemBuckets.length };
    }

    function sendBotQuery(rawText) {
      const box = document.getElementById('parisBotMessages');
      if (!box) return;

      const userDiv = document.createElement('div');
      userDiv.className = 'user-msg';
      userDiv.innerText = rawText;
      box.appendChild(userDiv);

      const qRaw = normalizeBotDigits(rawText).toLowerCase().replace(/,/g, '');
      const qNorm = normalizeBotArabic(rawText).replace(/,/g, '');
      const inStock = productsData.filter(p => getProductStock(p.id, p.title) > 0);

      let replyHtml = '';

      // Detect department if requested using normalized tokens
      const normTokens = qNorm.replace(/[^\\u0621-\\u064A0-9 ]/g, ' ').split(/ +/).filter(Boolean).map(t => (t.length > 3 && t.startsWith('ال')) ? t.slice(2) : t);
      let targetMall = '';
      if (normTokens.some(t => ['ملابس', 'هدوم', 'ازياء'].includes(t))) targetMall = 'clothes';
      else if (normTokens.some(t => ['منزل', 'منزليه', 'مطبخ', 'ديكور'].includes(t))) targetMall = 'home';
      else if (normTokens.some(t => ['احذيه', 'شوز', 'شوزات', 'جزم', 'جزمه'].includes(t))) targetMall = 'shoes';

      // Extract numeric budget or range
      const nums = (qNorm.match(/[0-9]+/g) || []).map(n => parseInt(n, 10)).filter(n => n > 0);

      // Guard if asked explicitly about installments or returns (handles combined questions clearly)
      const asksInstallment = /قسط|تقسيط|فاليو|valu/.test(qRaw);
      const asksReturn = /استرجاع|استبدال|ارجاع|ترجيع/.test(qRaw);

      // Base pool respects department if requested, plus parsed item/modifier groups
      const deptPool = targetMall ? inStock.filter(p => p.mall === targetMall) : inStock;
      const parsed = parseBotTokens(qNorm, true);
      const allGroups = [...parsed.itemGroups.map(g => g.syns), ...parsed.modifierGroups];

      if ((asksInstallment || asksReturn) && nums.length === 0) {
        const parts = [];
        if (asksReturn) parts.push('متاح لك <strong>فتح الشحنة ومعاينتها وفحصها بالكامل مع المندوب قبل الدفع</strong>، ولا يوجد استرجاع أو استبدال بعد الاستلام.');
        if (asksInstallment) parts.push('الدفع لدينا <strong>كاش عند الاستلام فقط</strong> (لا يوجد نظام تقسيط).');
        replyHtml = parts.join('<br>') + '<br>اكتب ميزانيتك الكاش أو اسم المنتج الآن وسأعرض لك المتاح فوراً!';
      } else if (nums.length >= 2 && (/من|بين|الي|-/.test(qNorm))) {
        const minB = Math.min(nums[0], nums[1]);
        const maxB = Math.max(nums[0], nums[1]);
        let pool = allGroups.length > 0 ? filterProductsByBotGroups(deptPool, allGroups) : deptPool;
        let matches = pool.filter(p => p.price >= minB && p.price <= maxB).sort((a, b) => b.price - a.price);
        if (matches.length > 0) {
          replyHtml = 'متاح لدينا <strong>' + matches.length + '</strong> منتج بين <strong>' + formatPrice(minB) + '</strong> و<strong>' + formatPrice(maxB) + ' ج.م</strong>:' +
            matches.slice(0, 6).map(renderBotProductCard).join('');
        } else {
          replyHtml = 'لا توجد منتجات متوفرة في النطاق من ' + formatPrice(minB) + ' إلى ' + formatPrice(maxB) + ' ج.م حالياً. جرّب ميزانية أخرى!';
        }
      } else if (nums.length >= 1) {
        const budget = nums[0];
        const isAbove = /فوق|اعلي|اكثر/.test(qNorm);
        let pool = allGroups.length > 0 ? filterProductsByBotGroups(deptPool, allGroups) : deptPool;
        let matches = isAbove
          ? pool.filter(p => p.price >= budget).sort((a, b) => a.price - b.price)
          : pool.filter(p => p.price <= budget).sort((a, b) => b.price - a.price);

        // If user asked for 2+ distinct items with a budget (e.g., "معاي 4000 عاوز جاكيت وبنطلون")
        if (matches.length === 0 && parsed.itemGroups.length >= 2 && !isAbove) {
          const combo = buildComboMatches(deptPool, parsed, budget);
          if (combo.combined.length > 0) {
            replyHtml = 'في حدود ميزانيتك <strong>' + formatPrice(budget) + ' ج.م</strong>، هذه الخيارات المتاحة لطلبك (أقل تجميعة متوفرة بحوالي <strong>' + formatPrice(combo.sumMin) + ' ج.م</strong>):' +
              combo.combined.slice(0, 6).map(renderBotProductCard).join('');
          } else if (combo.overBudget) {
            replyHtml = 'أقل إجمالي متاح لطلبك يبدأ من <strong>' + formatPrice(combo.sumMin) + ' ج.م</strong> (أعلى من ' + formatPrice(budget) + ' ج.م).';
          } else {
            replyHtml = 'عذراً، لا تتوفر حالياً منتجات مطابقة لطلبك ضمن ميزانية <strong>' + formatPrice(budget) + ' ج.م</strong>.';
          }
        } else if (matches.length > 0) {
          const intro = isAbove
            ? 'المتاح بسعر أعلى من <strong>' + formatPrice(budget) + ' ج.م</strong> (' + matches.length + ' منتج):'
            : 'على قد ميزانيتك حتى <strong>' + formatPrice(budget) + ' ج.م</strong>، متاح لدينا <strong>' + matches.length + ' منتج</strong> (أفضل الاختيارات):';
          replyHtml = intro + matches.slice(0, 6).map(renderBotProductCard).join('');
        } else if (pool.length > 0) {
          const cheapest = [...pool].sort((a, b) => a.price - b.price).slice(0, 3);
          const minAvail = formatPrice(cheapest[0].price);
          replyHtml = 'المتوفر حالياً يبدأ من <strong>' + minAvail + ' ج.م</strong> — هذه أقل المنتجات المتوفرة سعراً:' +
            cheapest.map(renderBotProductCard).join('');
        } else {
          replyHtml = 'عذراً، لا تتوفر منتجات مطابقة لبحثك «' + escapeBotHtml(rawText) + '» حالياً.';
        }
      } else {
        // Pure product / department search
        let matches = [];
        if (allGroups.length > 0) {
          matches = filterProductsByBotGroups(deptPool, allGroups);
          if (matches.length === 0 && parsed.itemGroups.length >= 2) {
            const combo = buildComboMatches(deptPool, parsed, null);
            matches = combo.combined;
          }
        } else if (targetMall) {
          matches = deptPool;
        }

        if (matches.length > 0) {
          replyHtml = 'وجدت لك <strong>' + matches.length + ' منتج متوفر</strong> مطابق لبحثك:' +
            matches.slice(0, 8).map(renderBotProductCard).join('');
        } else if (allGroups.length > 0) {
          replyHtml = 'عذراً، غير متوفر حالياً «<strong>' + escapeBotHtml(rawText) + '</strong>» في المخزون.<br>المتاح لدينا حالياً: ملابس (بناطيل، قمصان، تيشيرتات، فساتين، بدل)، أحذية، وأدوات منزلية. اكتب اسم الصنف أو ميزانيتك!';
        } else {
          replyHtml = 'أنا مساعد المنتجات والميزانية فقط 😊<br>اكتب <strong>رقم ميزانيتك</strong> (مثلاً: <code>500</code> أو <code>2000</code> أو <code>10000</code>) أو اسم المنتج (مثل: <code>بناطيل</code>، <code>بدلة</code>، <code>أحذية</code>) وسأعرض لك المتاح فوراً.';
        }
      }

      const botDiv = document.createElement('div');
      botDiv.className = 'bot-msg';
      botDiv.innerHTML = replyHtml;
      box.appendChild(botDiv);
      box.scrollTop = box.scrollHeight;
    }

    // Initialize store state & restore persisted cart / coupon
    updateCartBadge();
    if (appliedCoupon) {
      const cInput = document.getElementById('cartCouponInput');
      if (cInput) cInput.value = appliedCoupon;
    }
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
