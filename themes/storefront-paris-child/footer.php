<?php
/**
 * Paris Store - Custom Footer Template
 * Matches exact UI design with 4 columns, dark forest green background (#093B23) & gold accents (#D4AF37)
 */
defined('ABSPATH') || exit;

$wa_num = get_option('paris_whatsapp_number', '201065968425');
$shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
$cart_url = function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/');
$checkout_url = function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : home_url('/checkout/');
$account_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/my-account/');
?>

  </div><!-- #content -->
</div><!-- #page -->

<!-- ===================== PARIS STORE LUXURY FOOTER ===================== -->
<footer class="paris-main-footer" role="contentinfo">
  <div class="paris-footer-container">
    
    <!-- 4 Columns Grid -->
    <div class="paris-footer-grid">

      <!-- Column 1 (Right): About Mall & Trust Badges -->
      <div class="paris-footer-col col-brand">
        <!-- Logo & Monogram -->
        <div class="footer-logo-wrap">
          <div class="footer-monogram">
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="rgba(212, 175, 55, 0.15)"></rect>
              <path d="M12 28V15C12 13.34 13.34 12 15 12C16.66 12 18 13.34 18 15V28" stroke="#D4AF37" stroke-width="2.6" stroke-linecap="round"></path>
              <path d="M22 28V15C22 13.34 23.34 12 25 12C26.66 12 28 13.34 28 15V28" stroke="#D4AF37" stroke-width="2.6" stroke-linecap="round"></path>
              <circle cx="20" cy="8" r="2.5" fill="#D4AF37"></circle>
            </svg>
          </div>
          <div class="footer-brand-names">
            <h3 class="footer-brand-title">مول باريس التجاري</h3>
            <span class="footer-brand-sub">أناقة الملابس وجودة المنزل</span>
          </div>
        </div>

        <!-- Description -->
        <h4 class="footer-lead-title">مول باريس التجاري - كل بيت له اختيار</h4>
        <p class="footer-lead-desc">
          وجهتك الأولى للملابس العصرية والأدوات المنزلية بأفضل الأسعار، مع خدمة شحن سريع وآمن لجميع محافظات مصر.
        </p>

        <!-- Trust Badges (4 Circles in Row) -->
        <div class="footer-trust-badges">
          <!-- Badge 1: توصيل سريع -->
          <div class="trust-badge-item" title="توصيل سريع">
            <div class="trust-badge-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <span class="trust-badge-label">توصيل</span>
          </div>

          <!-- Badge 2: تغليف محكم -->
          <div class="trust-badge-item" title="تغليف محكم">
            <div class="trust-badge-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span class="trust-badge-label">تغليف محكم</span>
          </div>

          <!-- Badge 3: الدفع عند الاستلام -->
          <div class="trust-badge-item" title="الدفع عند الاستلام">
            <div class="trust-badge-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <span class="trust-badge-label">الدفع عند الاستلام</span>
          </div>

          <!-- Badge 4: جودة وضمان -->
          <div class="trust-badge-item" title="جودة وضمان">
            <div class="trust-badge-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <span class="trust-badge-label">أمان وضمان</span>
          </div>
        </div>
      </div>

      <!-- Column 2 (Center-Right): Quick Links -->
      <div class="paris-footer-col col-quick-links">
        <h4 class="footer-heading">روابط سريعة</h4>
        <ul class="footer-links-list">
          <li>
            <a href="<?php echo home_url('/'); ?>">
              <span class="link-icon">🏠</span>
              <span>الرئيسية</span>
            </a>
          </li>
          <li>
            <a href="<?php echo esc_url($shop_url); ?>">
              <span class="link-icon">🛍️</span>
              <span>جميع المنتجات</span>
            </a>
          </li>
          <li>
            <a href="javascript:void(0);" class="paris-open-cart footer-cart-link">
              <span class="link-icon">🛒</span>
              <span>السلة</span>
            </a>
          </li>
          <li>
            <a href="<?php echo esc_url($checkout_url); ?>">
              <span class="link-icon">📝</span>
              <span>إتمام الطلب</span>
            </a>
          </li>
          <li>
            <a href="<?php echo esc_url($account_url); ?>">
              <span class="link-icon">👤</span>
              <span>حسابي</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Column 3 (Center-Left): Categories -->
      <div class="paris-footer-col col-categories">
        <h4 class="footer-heading">الأقسام</h4>
        <ul class="footer-links-list">
          <li>
            <a href="<?php echo home_url('/product-category/clothes/'); ?>">
              <span>قسم الملابس</span>
            </a>
          </li>
          <li>
            <a href="<?php echo home_url('/product-category/home/'); ?>">
              <span>قسم الأدوات المنزلية</span>
            </a>
          </li>
          <li>
            <a href="<?php echo home_url('/product-category/textiles/'); ?>">
              <span>مفروشات</span>
            </a>
          </li>
          <li>
            <a href="<?php echo esc_url(add_query_arg('on_sale', '1', $shop_url)); ?>">
              <span class="footer-sale-link">عروض وتخفيضات</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Column 4 (Left): Contact Us -->
      <div class="paris-footer-col col-contact">
        <h4 class="footer-heading">تواصل معنا</h4>

        <!-- WhatsApp Quick CTA Button -->
        <a href="https://wa.me/<?php echo esc_attr($wa_num); ?>" class="footer-whatsapp-btn" target="_blank" rel="noopener">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"></path>
          </svg>
          <span>واتساب</span>
        </a>

        <!-- Contact details -->
        <div class="footer-contact-details">
          <a href="https://wa.me/<?php echo esc_attr($wa_num); ?>" class="contact-line" target="_blank" rel="noopener">
            <span class="contact-line-icon">📞</span>
            <span>تواصل عبر واتساب</span>
          </a>
          <a href="tel:01065968425" class="contact-line">
            <span class="contact-line-icon">📞</span>
            <span>أرقام التواصل 0309-8662</span>
          </a>
        </div>

        <!-- Social Media Icons (3 Round Circles) -->
        <div class="footer-social-icons">
          <!-- Facebook -->
          <a href="https://facebook.com" class="social-circle-btn" target="_blank" rel="noopener" aria-label="فيسبوك">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <!-- Instagram -->
          <a href="https://instagram.com" class="social-circle-btn" target="_blank" rel="noopener" aria-label="إنستغرام">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <!-- YouTube -->
          <a href="https://youtube.com" class="social-circle-btn" target="_blank" rel="noopener" aria-label="يوتيوب">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#093B23"></polygon>
            </svg>
          </a>
        </div>
      </div>

    </div>

    <!-- Bottom Bar (Rights & Made With Love) -->
    <div class="paris-footer-bottom-bar">
      <div class="bottom-bar-right">
        <span>جميع الحقوق محفوظة © مول باريس التجاري 2026</span>
      </div>
      <div class="bottom-bar-left">
        <span>صنع بكل حب ❤️</span>
      </div>
    </div>

  </div>
</footer>
<!-- ===================== / PARIS STORE LUXURY FOOTER ===================== -->

<!-- Floating WhatsApp Button (Persistent Across All Pages) -->
<div class="paris-floating-whatsapp">
  <a href="https://wa.me/<?php echo esc_attr($wa_num); ?>" class="floating-wa-btn" target="_blank" rel="noopener" aria-label="تواصل معنا عبر واتساب">
    <span class="floating-wa-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"></path>
      </svg>
    </span>
    <span class="floating-wa-text">تواصل معنا</span>
  </a>
</div>

<?php wp_footer(); ?>
</body>
</html>
