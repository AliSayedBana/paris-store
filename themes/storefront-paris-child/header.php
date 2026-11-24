<?php

defined('ABSPATH') || exit;

// ------------------------------------------------------------
// Active mall detection: 'clothes' or 'home'
// ------------------------------------------------------------
$paris_home_slugs = ['home', 'kitchen', 'decor', 'textiles', 'cleaning', 'organization', 'appliances', 'cookware'];
$paris_home_term  = get_term_by('slug', 'home', 'product_cat');
$paris_home_id    = ($paris_home_term && ! is_wp_error($paris_home_term)) ? (int) $paris_home_term->term_id : 0;

$paris_term_in_home = function ($term) use ($paris_home_slugs, $paris_home_id) {
    if (! $term || is_wp_error($term) || empty($term->slug)) {
        return false;
    }
    return in_array($term->slug, $paris_home_slugs, true)
        || ($paris_home_id && in_array($paris_home_id, array_map('intval', get_ancestors($term->term_id, 'product_cat')), true));
};

// Explicit request (?mall=home) or search scope (?product_cat=home) wins; otherwise detect from the page.
$requested_mall = '';
if (isset($_GET['mall'])) {
    $requested_mall = sanitize_key(wp_unslash($_GET['mall']));
} elseif (isset($_GET['product_cat'])) {
    $requested_mall = sanitize_title(wp_unslash($_GET['product_cat']));
}

$current_mall = 'clothes'; // Default on front page or when in clothes
if (in_array($requested_mall, ['clothes', 'home'], true)) {
    $current_mall = $requested_mall;
} elseif (is_product_category()) {
    $current_mall = $paris_term_in_home(get_queried_object()) ? 'home' : 'clothes';
} elseif (is_product()) {
    $product_terms = get_the_terms(get_queried_object_id(), 'product_cat');
    if ($product_terms && ! is_wp_error($product_terms)) {
        foreach ($product_terms as $product_term) {
            if ($paris_term_in_home($product_term)) {
                $current_mall = 'home';
                break;
            }
        }
    }
}

// Current category slug (for highlighting the active sub-link) + sale view flag
$current_slug = '';
if (is_product_category()) {
    $queried_term = get_queried_object();
    if ($queried_term && ! empty($queried_term->slug)) {
        $current_slug = $queried_term->slug;
    }
}
$is_sale_view = ! empty($_GET['on_sale']);

// Search scope (keeps the selected scope on the results page)
$search_scope = isset($_GET['product_cat']) ? sanitize_title(wp_unslash($_GET['product_cat'])) : '';
?><!DOCTYPE html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- ===================== SIDE CART DRAWER ===================== -->
<div class="paris-cart-overlay"></div>
<div class="paris-cart-panel" id="paris-cart-panel" role="dialog" aria-label="سلة التسوق">
  <div class="paris-cart-panel-header">
    <div class="paris-cart-panel-title">
      🛒 سلتك - حاجاتك المختارة
      <span class="cart-count-badge"><?php echo WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?></span>
    </div>
    <button class="paris-cart-close" aria-label="إغلاق السلة">✕</button>
  </div>
  <div class="paris-cart-panel-body">
    <div class="paris-cart-loading"><div class="paris-spinner"></div></div>
  </div>
  <div class="paris-cart-panel-footer">
    <div class="paris-cart-total-row">
      <span class="paris-cart-total-label">المجموع للشراء</span>
      <span class="paris-cart-total-value">
        <?php echo WC()->cart ? WC()->cart->get_cart_total() : '0 ج.م'; ?>
      </span>
    </div>
    <p class="paris-cart-shipping-note">تفاصيل الشحن تتحدد عند تأكيد الطلب</p>
    <a href="<?php echo wc_get_checkout_url(); ?>" class="paris-cart-checkout-btn">
      كمّل طلبك &larr;
    </a>
    <a href="<?php echo esc_url( wc_get_cart_url() ); ?>" class="paris-drawer-view-cart-btn" style="display:block;text-align:center;margin-top:10px;font-size:13.5px;color:#133e29;font-weight:700;text-decoration:none;">
      📋 فتح صفحة السلة الكاملة
    </a>
  </div>
</div>
<!-- ===================== / SIDE CART DRAWER ===================== -->

<!-- ===================== 1. TOP ANNOUNCEMENT BAR ===================== -->
<div class="paris-top-bar">
  <div class="paris-top-bar-inner">
    <div class="top-bar-center">
      أدوات منزلية وملابس لكل العائلة.. عروض حصرية لفترة محدودة
    </div>
    <div class="top-bar-contact">
      <a href="https://wa.me/<?php echo get_option('paris_whatsapp_number', '201065968425'); ?>" target="_blank" rel="noopener" aria-label="تواصل معنا عبر واتساب">
        <span class="top-contact-label">تواصل معنا</span>
        <span class="top-phone-icon">📞</span>
      </a>
    </div>
  </div>
</div>
<!-- ===================== / TOP ANNOUNCEMENT BAR ===================== -->

<!-- ===================== 2. MAIN HEADER ===================== -->
<header class="paris-header" role="banner">
  <div class="paris-header-inner">

    <!-- Logo & Brand (Right in RTL) -->
    <a href="<?php echo home_url('/'); ?>" class="paris-brand-logo" aria-label="مول باريس التجاري - الصفحة الرئيسية">
      <div class="paris-brand-text">
        <strong class="brand-name">مول باريس التجاري</strong>
        <span class="brand-tagline">أناقة الملابس وجودة المنزل</span>
      </div>
      <div class="paris-brand-icon">
        <svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 36V16C14 12.6863 16.6863 10 20 10C23.3137 10 26 12.6863 26 16V36" stroke="#c59b27" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M26 22C26 18.6863 28.6863 16 32 16C35.3137 16 38 18.6863 38 22V36" stroke="#16432f" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="20" cy="11" r="2.5" fill="#d4af37"/>
          <circle cx="32" cy="17" r="2.5" fill="#1b4d36"/>
        </svg>
      </div>
    </a>

    <!-- Center Search Bar (scope + input + submit) -->
    <form class="paris-search-bar" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
      <select name="product_cat" class="paris-search-scope" aria-label="نطاق البحث">
        <option value="">كل الأقسام</option>
        <option value="clothes" <?php selected($search_scope, 'clothes'); ?>>الملابس</option>
        <option value="home" <?php selected($search_scope, 'home'); ?>>الأدوات المنزلية</option>
      </select>
      <input type="text" name="s" class="paris-search-input" placeholder="ابحث عن الملابس، الأدوات المنزلية، أو الديكور..." value="<?php echo esc_attr(get_search_query()); ?>" autocomplete="off" aria-label="بحث في المتجر">
      <input type="hidden" name="post_type" value="product">
      <button type="submit" class="paris-search-btn" aria-label="بحث">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>

    <!-- Header Actions (Left in RTL) -->
    <div class="paris-header-actions">
      <!-- Account Button -->
      <a href="<?php echo get_permalink(get_option('woocommerce_myaccount_page_id')); ?>" class="paris-account-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="account-label">حسابي</span>
      </a>

      <!-- Coral Orange Cart Button -->
      <button type="button" class="paris-coral-cart-btn paris-open-cart" aria-label="السلة">
        <span class="cart-btn-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </span>
        <span class="cart-btn-text">السلة</span>
        <span class="paris-cart-count"><?php echo WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?></span>
      </button>
    </div>

  </div>
</header>
<!-- ===================== / MAIN HEADER ===================== -->

<!-- ===================== 3. DUAL-MALL TABS & CATEGORIES ===================== -->
<?php
// Sub-navigation: label / url / category slug (used to mark the active link)
$paris_nav = [
    'clothes' => [
        ['label' => 'كل الملابس',        'url' => home_url('/product-category/clothes/'),              'slug' => 'clothes', 'all'  => true],
        ['label' => 'ملابس رجالية',      'url' => home_url('/product-category/clothes/men/'),          'slug' => 'men'],
        ['label' => 'ملابس نسائية',      'url' => home_url('/product-category/clothes/women/'),        'slug' => 'women'],
        ['label' => 'أطفال',             'url' => home_url('/product-category/clothes/kids/'),         'slug' => 'kids'],
        ['label' => 'تخفيضات الملابس %', 'url' => home_url('/product-category/clothes/?on_sale=1'),    'slug' => 'clothes', 'sale' => true],
    ],
    'home' => [
        ['label' => 'كل الأدوات المنزلية', 'url' => home_url('/product-category/home/'),               'slug' => 'home', 'all' => true],
        ['label' => 'أدوات المطبخ',        'url' => home_url('/product-category/home/kitchen/'),       'slug' => 'kitchen'],
        ['label' => 'ديكورات',             'url' => home_url('/product-category/home/decor/'),         'slug' => 'decor'],
        ['label' => 'مفروشات',             'url' => home_url('/product-category/textiles/'),           'slug' => 'textiles'],
        ['label' => 'تنظيم',               'url' => home_url('/product-category/home/organization/'),  'slug' => 'organization'],
        ['label' => 'تنظيف',               'url' => home_url('/product-category/home/cleaning/'),      'slug' => 'cleaning'],
        ['label' => 'تخفيضات الأدوات %',   'url' => home_url('/product-category/home/?on_sale=1'),     'slug' => 'home', 'sale' => true],
    ],
];

$paris_link_active = function ($link, $mall_key) use ($current_slug, $is_sale_view, $current_mall) {
    if (! empty($link['sale'])) {
        return $is_sale_view && $current_slug === $link['slug'];
    }
    if ($is_sale_view) {
        return false;
    }
    if ($current_slug !== '') {
        return $current_slug === $link['slug'];
    }
    return ! empty($link['all']) && $mall_key === $current_mall && is_front_page();
};
?>
<nav class="paris-nav-container" aria-label="التنقل الذكي والأقسام">
  <div class="paris-nav-inner">

    <!-- Main Malls (segmented tabs) -->
    <div class="paris-dual-malls">
      <button type="button" class="paris-mall-tab <?php echo ($current_mall === 'clothes') ? 'active' : ''; ?>" data-mall="clothes" data-url="<?php echo esc_url($paris_nav['clothes'][0]['url']); ?>">
        <svg class="mall-tab-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
        <span>مول باريس للملابس</span>
      </button>
      <button type="button" class="paris-mall-tab <?php echo ($current_mall === 'home') ? 'active' : ''; ?>" data-mall="home" data-url="<?php echo esc_url($paris_nav['home'][0]['url']); ?>">
        <svg class="mall-tab-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>مول باريس للأدوات المنزلية</span>
      </button>
    </div>

    <!-- Sub-categories: Clothes (#subnav-clothes) and Home & Living (#subnav-home) -->
    <?php foreach ($paris_nav as $mall_key => $links) : ?>
    <div class="paris-subnav-list subnav-for-<?php echo esc_attr($mall_key); ?> <?php echo ($current_mall === $mall_key) ? 'active' : ''; ?>" id="subnav-<?php echo esc_attr($mall_key); ?>">
      <?php foreach ($links as $link) :
          $is_active = $paris_link_active($link, $mall_key);
          $link_class = 'subnav-link' . (! empty($link['sale']) ? ' subnav-discount' : '') . ($is_active ? ' active' : '');
      ?>
      <a href="<?php echo esc_url($link['url']); ?>" class="<?php echo esc_attr($link_class); ?>"<?php echo $is_active ? ' aria-current="page"' : ''; ?>><?php echo esc_html($link['label']); ?></a>
      <?php endforeach; ?>
    </div>
    <?php endforeach; ?>

  </div>
</nav>
<!-- ===================== / DUAL-MALL TABS & CATEGORIES ===================== -->

<div id="page" class="site">
  <div id="content" class="site-content">