<?php
/**
 * Paris Store - Front Page Template v3.2
 * تحديث شريط الأقسام السريعة والبطاقات والفلاتر وشريط المزايا السفلي
 */
defined('ABSPATH') || exit;

get_header();

$shop_url = get_permalink(wc_get_page_id('shop'));
$cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0]);
?>

<!-- ===================== 1. HERO SECTION (Dual Mall) ===================== -->
<section class="paris-hero-section">
  <div class="paris-hero-grid">

    <!-- Right Box: Home & Living -->
    <div class="paris-hero-card paris-hero-home">
      <div class="paris-eyebrow-pill">
        <span class="eyebrow-text">للأدوات المنزلية والديكور — كل ركن في البيت له اختيار</span>
      </div>

      <h1 class="paris-hero-title">
        بيتك يستاهل..<br>
        <span class="hero-green-title">خيارات تجمّله</span>
      </h1>

      <p class="paris-hero-desc">
        اكتشف أحدث الأدوات المنزلية والديكورات التي تضفي لمسة خاصة على منزلك
      </p>

      <div class="paris-hero-cta-wrap">
        <a href="<?php echo home_url('/product-category/home/'); ?>" class="paris-btn-forest">
          <span>تسوق الآن</span>
          <span class="btn-arrow">&larr;</span>
        </a>
      </div>
    </div>

    <!-- Left Box: Fashion Lifestyle -->
    <div class="paris-hero-card paris-hero-fashion">
      <div class="fashion-image-wrap">
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=80" 
             alt="أناقة الملابس الشتوية والخريفية - مول باريس التجاري" 
             class="fashion-img" 
             loading="eager">
        <div class="fashion-floating-card">
          <strong class="floating-title">أناقتك اليومية</strong>
          <a href="<?php echo home_url('/product-category/clothes/'); ?>" class="floating-link">اكتشف جديدنا</a>
        </div>
      </div>
    </div>

  </div>
</section>
<!-- ===================== / HERO SECTION ===================== -->

<!-- ===================== 2. QUICK CATEGORY CARDS (4 Cards) ===================== -->
<section class="paris-quick-cards-section">
  <div class="paris-quick-cards-grid">

    <!-- Card 1: احتياجات البيت -->
    <a href="<?php echo home_url('/product-category/home/'); ?>" class="quick-card-item">
      <div class="quick-card-text">
        <strong class="quick-card-title">احتياجات البيت</strong>
        <span class="quick-card-sub">في مكان واحد</span>
      </div>
      <div class="quick-card-icon icon-home">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c59b27" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </a>

    <!-- Card 2: مستلزمات مطبخ -->
    <a href="<?php echo home_url('/product-category/home/kitchen/'); ?>" class="quick-card-item">
      <div class="quick-card-text">
        <strong class="quick-card-title">مستلزمات مطبخ</strong>
        <span class="quick-card-sub">لاستخدام كل يوم</span>
      </div>
      <div class="quick-card-icon icon-kitchen">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#133e29" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
    </a>

    <!-- Card 3: ديكور وتنظيم -->
    <a href="<?php echo home_url('/product-category/home/decor/'); ?>" class="quick-card-item">
      <div class="quick-card-text">
        <strong class="quick-card-title">ديكور وتنظيم</strong>
        <span class="quick-card-sub">لمسات لكل ركن</span>
      </div>
      <div class="quick-card-icon icon-decor">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c59b27" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a5 5 0 0 1 5 5c0 5-5 9-5 9s-5-4-5-9a5 5 0 0 1 5-5z"></path>
          <path d="M7 17l5 5 5-5"></path>
        </svg>
      </div>
    </a>

    <!-- Card 4: سلة سهلة (مع لمسة برتقالي مرجاني) -->
    <a href="javascript:void(0);" class="quick-card-item quick-card-cart paris-open-cart">
      <div class="quick-card-text">
        <strong class="quick-card-title">سلة سهلة</strong>
        <span class="quick-card-sub">اختار طلبك براحتك</span>
      </div>
      <div class="quick-card-icon icon-cart-coral">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eb6b47" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </div>
    </a>

  </div>
</section>
<!-- ===================== / QUICK CATEGORY CARDS ===================== -->

<!-- ===================== 3. PRODUCTS SECTION ===================== -->
<section class="paris-products-section">
  
  <!-- Header: Title & Subtitle & All Link -->
  <div class="paris-section-header">
    <div class="paris-section-title-wrap">
      <h2 class="paris-section-title">كل ركن في بيتك، له اختيار.</h2>
      <p class="paris-section-subtitle">أدوات منزلية ومستلزمات عملية لحياة يومية أسهل.</p>
    </div>
    <a href="<?php echo $shop_url; ?>" class="paris-section-link">
      <span>كل المنتجات</span>
      <span class="link-arrow">&larr;</span>
    </a>
  </div>

  <!-- Interactive Category Filter Pills -->
  <?php
  // Calculate counts
  $total_count = wp_count_posts('product')->publish;
  $home_term = get_term_by('slug', 'home', 'product_cat');
  $clothes_term = get_term_by('slug', 'clothes', 'product_cat');
  $textiles_term = get_term_by('slug', 'textiles', 'product_cat');

  $home_cnt = $home_term ? $home_term->count : 0;
  $clothes_cnt = $clothes_term ? $clothes_term->count : 0;
  $textiles_cnt = $textiles_term ? $textiles_term->count : 0;
  ?>
  <div class="paris-filter-pills" id="paris-home-pills">
    <button type="button" class="paris-pill active" data-filter="clothes">
      <span>قسم الملابس</span>
      <em class="pill-badge"><?php echo $clothes_cnt; ?></em>
    </button>
    
    <button type="button" class="paris-pill" data-filter="home">
      <span>قسم الأدوات المنزلية</span>
      <em class="pill-badge"><?php echo $home_cnt; ?></em>
    </button>
    
    <button type="button" class="paris-pill" data-filter="textiles">
      <span>مفروشات</span>
      <em class="pill-badge"><?php echo $textiles_cnt; ?></em>
    </button>

    <button type="button" class="paris-pill" data-filter="all">
      <span>كل المنتجات</span>
      <em class="pill-badge"><?php echo $total_count; ?></em>
    </button>
  </div>

  <!-- Products Grid (Modern Elegant Cards - 3 Columns Match) -->
  <?php
  $args = [
      'post_type'      => 'product',
      'posts_per_page' => 24,
      'post_status'    => 'publish',
      'orderby'        => [
          'menu_order' => 'ASC',
          'date'       => 'DESC',
      ],
  ];
  $products = new WP_Query($args);

  if ($products->have_posts()) :
      echo '<div class="woocommerce">';
      echo '<ul class="products columns-3 paris-products-grid">';
      while ($products->have_posts()) : $products->the_post();
          wc_get_template_part('content', 'product');
      endwhile;
      wp_reset_postdata();
      echo '</ul>';
      echo '</div>'; // .woocommerce
  else:
      echo '<div style="text-align:center;padding:60px 20px;color:#999;"><p>لا يوجد منتجات بعد.</p></div>';
  endif;
  ?>
</section>
<!-- ===================== / PRODUCTS SECTION ===================== -->

<!-- ===================== 4. SERVICE FEATURES BAR (Footer Bar) ===================== -->
<section class="paris-features-bar-section">
  <div class="paris-features-bar">

    <!-- Feature 1 -->
    <div class="feature-bar-item">
      <span class="feature-bar-icon icon-check">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c59b27" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </span>
      <span class="feature-bar-text">تنوع وجودة مضمونة</span>
    </div>

    <!-- Feature 2 -->
    <div class="feature-bar-item">
      <span class="feature-bar-icon icon-chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#133e29" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </span>
      <span class="feature-bar-text">تأكيد فوري عبر واتساب</span>
    </div>

    <!-- Feature 3 -->
    <div class="feature-bar-item">
      <span class="feature-bar-icon icon-truck">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c59b27" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </span>
      <span class="feature-bar-text">توصيل سريع وبأقل تكلفة</span>
    </div>

    <!-- WhatsApp Direct Order CTA -->
    <div class="feature-bar-action">
      <a href="https://wa.me/<?php echo get_option('paris_whatsapp_number', '201065968425'); ?>" class="paris-btn-wa-action" target="_blank" rel="noopener">
        <span class="wa-action-icon">💬</span>
        <span>تواصل معنا / اطلب الآن</span>
      </a>
    </div>

  </div>
</section>
<!-- ===================== / SERVICE FEATURES BAR ===================== -->

<?php get_footer(); ?>
