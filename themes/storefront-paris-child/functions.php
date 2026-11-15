<?php
/**
 * Paris Store Child Theme - functions.php
 * الثيم الكامل لمتجر مول باريس التجاري
 */

defined('ABSPATH') || exit;

// ============================================================
// 1. ENQUEUE STYLES & SCRIPTS
// ============================================================
add_action('wp_enqueue_scripts', 'paris_child_enqueue', 20);
function paris_child_enqueue() {
    // Parent theme
    wp_enqueue_style('storefront-style', get_template_directory_uri() . '/style.css');
    // Cairo Google Font
    wp_enqueue_style('paris-font', 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap', [], null);
    // Child main CSS
    wp_enqueue_style('paris-child-style', get_stylesheet_directory_uri() . '/assets/css/paris-store.css', ['storefront-style'], '2.0');
    // Side Cart JS
    wp_enqueue_script('paris-cart-js', get_stylesheet_directory_uri() . '/assets/js/paris-cart.js', ['jquery'], '2.0', true);
    // Pass AJAX url & nonce
    wp_localize_script('paris-cart-js', 'parisAjax', [
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('paris_cart_nonce'),
        'cartUrl' => wc_get_cart_url(),
        'checkoutUrl' => wc_get_checkout_url(),
    ]);
}

// ============================================================
// 2. THEME SUPPORTS
// ============================================================
add_action('after_setup_theme', 'paris_child_setup');
function paris_child_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');

    // Register navigation menus
    register_nav_menus([
        'primary'  => 'القائمة الرئيسية',
        'category' => 'قائمة الفئات',
    ]);
}

// ============================================================
// 3. CAIRO FONT EVERYWHERE
// ============================================================
add_action('wp_head', 'paris_global_styles', 1);
function paris_global_styles() {
    echo '<style>
    *, body, h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, label {
        font-family: "Cairo", Arial, sans-serif !important;
    }
    </style>';
}

// ============================================================
// 4. CURRENCY & PRICE FORMAT
// ============================================================
add_filter('woocommerce_currency_symbol', function($symbol, $currency) {
    return 'ج.م';
}, 10, 2);

add_filter('woocommerce_price_format', function() {
    return '%2$s %1$s';
});

add_filter('woocommerce_price_trim_zeros', '__return_true');

add_filter('wc_price_args', function($args) {
    $args['decimals'] = 0;
    return $args;
});

// ============================================================
// 5. REMOVE STOREFRONT DEFAULTS WE DON'T NEED
// ============================================================
remove_action('storefront_header', 'storefront_site_branding', 20);
remove_action('storefront_header', 'storefront_product_search', 40);
remove_action('storefront_header', 'storefront_header_cart', 60);
remove_action('storefront_before_content', 'woocommerce_breadcrumb', 10);
remove_action('storefront_sidebar', 'storefront_get_sidebar', 10);

// Remove page title on homepage without recursion
add_filter('the_title', function($title, $id = null) {
    if (is_front_page() && $id && (int)$id === (int)get_option('page_on_front') && in_the_loop()) {
        return '';
    }
    return $title;
}, 10, 2);

// Hide default page header on Cart and Checkout
add_action('wp', function() {
    if (function_exists('is_cart') && is_cart()) {
        remove_action('storefront_page', 'storefront_page_header', 10);
    }
    if (function_exists('is_checkout') && is_checkout()) {
        remove_action('storefront_page', 'storefront_page_header', 10);
    }
});

// Hide page title element
add_filter('woocommerce_show_page_title', '__return_false');

// ============================================================
// 6. CUSTOM HEADER OUTPUT (replaces storefront header)
// ============================================================
remove_action('storefront_header', 'storefront_header_container', 0);
remove_action('storefront_header', 'storefront_header_container_close', 41);
remove_action('storefront_header', 'storefront_primary_navigation_wrapper', 42);
remove_action('storefront_header', 'storefront_primary_navigation', 50);
remove_action('storefront_header', 'storefront_primary_navigation_wrapper_close', 68);

// ============================================================
// 7. PRODUCT BADGES
// ============================================================
add_action('woocommerce_before_shop_loop_item_title', 'paris_product_badges', 5);
function paris_product_badges() {
    global $product;
    $badges = '';
    if ($product->is_on_sale()) {
        $regular = floatval($product->get_regular_price());
        $sale    = floatval($product->get_sale_price());
        if ($regular > 0) {
            $pct = round(100 - ($sale / $regular * 100));
            $badges .= '<span class="paris-badge paris-badge--sale">خصم ' . $pct . '%</span>';
        }
    }
    $date_created = $product->get_date_created();
    if ($date_created && (time() - $date_created->getTimestamp()) < 30 * DAY_IN_SECONDS) {
        $badges .= '<span class="paris-badge paris-badge--new">جديد</span>';
    }
    if (!$product->is_in_stock()) {
        $badges .= '<span class="paris-badge paris-badge--out">نفد</span>';
    }
    if ($badges) echo '<div class="paris-badges">' . $badges . '</div>';
}

// ============================================================
// 8. WISHLIST HEART BUTTON ON CARDS
// ============================================================
add_action('woocommerce_before_shop_loop_item_title', 'paris_wishlist_heart', 6);
function paris_wishlist_heart() {
    echo '<button class="paris-heart" aria-label="أضف للمفضلة" onclick="return false;">♡</button>';
}

// ============================================================
// 9. PRODUCT CATEGORY LABEL ON CARD
// ============================================================
add_action('woocommerce_before_shop_loop_item_title', 'paris_product_category_label', 7);
function paris_product_category_label() {
    global $product;
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        $term = array_shift($terms);
        if ($term->slug !== 'uncategorized') {
            echo '<span class="paris-cat-label">' . esc_html($term->name) . '</span>';
        }
    }
}

// ============================================================
// 10. SHOP PAGE - REMOVE DEFAULTS, ADD CUSTOM LAYOUT
// ============================================================
// Remove default WooCommerce sidebar on shop
add_filter('storefront_layout', function() {
    return 'full-width';
});

// Product columns
add_filter('loop_shop_columns', function() { return 4; });
add_filter('loop_shop_per_page', function() { return 12; }, 20);

// ============================================================
// 11. AJAX CART HANDLER
// ============================================================
add_action('wp_ajax_paris_get_cart', 'paris_get_cart_html');
add_action('wp_ajax_nopriv_paris_get_cart', 'paris_get_cart_html');
function paris_get_cart_html() {
    check_ajax_referer('paris_cart_nonce', 'nonce');
    ob_start();
    $cart_items = WC()->cart->get_cart();
    $total = WC()->cart->get_cart_total();
    $count = WC()->cart->get_cart_contents_count();
    echo json_encode([
        'count' => $count,
        'total' => strip_tags($total),
        'html'  => paris_render_cart_items($cart_items),
    ]);
    wp_die();
}

function paris_render_cart_items($cart_items) {
    if (empty($cart_items)) {
        return '<div class="paris-cart-empty"><span>🛒</span><p>سلتك فاضية</p></div>';
    }
    $html = '';
    foreach ($cart_items as $key => $item) {
        $product  = $item['data'];
        $img      = get_the_post_thumbnail_url($item['product_id'], 'thumbnail') ?: wc_placeholder_img_src();
        $name     = $product->get_name();
        $price    = wc_price($product->get_price());
        $qty      = $item['quantity'];
        $html .= '<div class="paris-cart-item" data-key="' . esc_attr($key) . '">';
        $html .= '<img src="' . esc_url($img) . '" alt="' . esc_attr($name) . '">';
        $html .= '<div class="paris-cart-item-info">';
        $html .= '<p class="paris-cart-item-name">' . esc_html($name) . '</p>';
        $html .= '<p class="paris-cart-item-price">' . $price . '</p>';
        $html .= '<div class="paris-cart-qty">';
        $html .= '<button class="paris-qty-btn paris-qty-minus" data-key="' . esc_attr($key) . '">−</button>';
        $html .= '<span class="paris-qty-val">' . $qty . '</span>';
        $html .= '<button class="paris-qty-btn paris-qty-plus" data-key="' . esc_attr($key) . '">+</button>';
        $html .= '</div></div>';
        $html .= '<button class="paris-cart-remove" data-key="' . esc_attr($key) . '">×</button>';
        $html .= '</div>';
    }
    return $html;
}

add_action('wp_ajax_paris_update_cart', 'paris_update_cart');
add_action('wp_ajax_nopriv_paris_update_cart', 'paris_update_cart');
function paris_update_cart() {
    check_ajax_referer('paris_cart_nonce', 'nonce');
    $key    = sanitize_text_field($_POST['key'] ?? '');
    $action = sanitize_text_field($_POST['action_type'] ?? '');
    if ($action === 'remove') {
        WC()->cart->remove_cart_item($key);
    } elseif ($action === 'plus') {
        $cart = WC()->cart->get_cart();
        if (isset($cart[$key])) {
            WC()->cart->set_quantity($key, $cart[$key]['quantity'] + 1);
        }
    } elseif ($action === 'minus') {
        $cart = WC()->cart->get_cart();
        if (isset($cart[$key])) {
            $newqty = $cart[$key]['quantity'] - 1;
            if ($newqty < 1) WC()->cart->remove_cart_item($key);
            else WC()->cart->set_quantity($key, $newqty);
        }
    }
    paris_get_cart_html();
}

// ============================================================
// 12. OUT-OF-STOCK BADGE ON PRODUCT LISTINGS
// ============================================================
add_filter('woocommerce_product_is_visible', function($visible, $id) {
    return true; // Always show out-of-stock
}, 10, 2);

// ============================================================
// 13. REMOVE STOREFRONT FOOTER WIDGETS / CUSTOMIZE FOOTER
// ============================================================
add_filter('storefront_credit_link', '__return_empty_string');

// ============================================================
// 14. ADMIN BODY CLASS FOR FULL WIDTH
// ============================================================
add_filter('body_class', function($classes) {
    if (is_shop() || is_product_category()) {
        $classes[] = 'paris-shop-page';
        $classes[] = 'full-width';
    }
    if (is_front_page()) {
        $classes[] = 'paris-home-page';
    }
    return $classes;
});

// ============================================================
// 15. WOOCOMMERCE NOTICES IN HEADER CART
// ============================================================
add_filter('woocommerce_add_to_cart_fragments', function($fragments) {
    $count = WC()->cart->get_cart_contents_count();
    $fragments['.paris-cart-count'] = '<span class="paris-cart-count">' . $count . '</span>';
    return $fragments;
});

// ============================================================
// 16. CUSTOM SHOP HEADER (Category Filter Pills)
// ============================================================
add_action('woocommerce_before_shop_loop', 'paris_shop_category_pills', 5);
function paris_shop_category_pills() {
    $cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0]);
    if (empty($cats) || is_wp_error($cats)) return;
    $current_cat = get_queried_object();
    $current_slug = isset($current_cat->slug) ? $current_cat->slug : '';
    echo '<div class="paris-filter-pills">';
    $all_active = empty($current_slug) ? 'active' : '';
    echo '<a href="' . get_permalink(wc_get_page_id('shop')) . '" class="paris-pill ' . $all_active . '">كل المنتجات</a>';
    foreach ($cats as $cat) {
        if ($cat->slug === 'uncategorized') continue;
        $active = ($cat->slug === $current_slug) ? 'active' : '';
        echo '<a href="' . get_term_link($cat) . '" class="paris-pill ' . $active . '">' . esc_html($cat->name) . ' <em>' . $cat->count . '</em></a>';
    }
    echo '</div>';
}

// ============================================================
// 17. REMOVE STOREFRONT UNNECESSARY HOOKS
// ============================================================
add_action('init', function() {
    remove_action('storefront_before_content', 'storefront_homepage_header', 10);
    remove_action('woocommerce_after_single_product_summary', 'storefront_single_product_pagination', 30);
    remove_action('woocommerce_after_single_product_summary', 'storefront_upsell_display', 15);
});

// ============================================================
// 18. RETURN TO SHOP REDIRECT & CLEAN SHOP URLS
// ============================================================
add_filter('woocommerce_return_to_shop_redirect', function() {
    return home_url('/');
});

add_action('template_redirect', function() {
    if (is_shop() || (function_exists('is_page') && is_page(790))) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

// ============================================================
// 19. SINGLE PRODUCT ENHANCEMENTS
// ============================================================
// Breadcrumb and back navigation
add_action('woocommerce_before_single_product', 'paris_single_product_breadcrumb', 15);
function paris_single_product_breadcrumb() {
    global $product;
    if (! $product) return;

    $terms = get_the_terms($product->get_id(), 'product_cat');
    $cat_name = '';
    $cat_link = home_url('/');
    if ($terms && ! is_wp_error($terms)) {
        foreach ($terms as $term) {
            if ($term->slug !== 'uncategorized') {
                $cat_name = $term->name;
                $cat_link = get_term_link($term);
                break;
            }
        }
    }

    echo '<div class="paris-sp-breadcrumb-bar">';
    echo '  <a href="' . esc_url(home_url('/')) . '" class="paris-sp-back-btn">';
    echo '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
    echo '    <span>العودة للمتجر</span>';
    echo '  </a>';
    if ($cat_name) {
        echo '  <span class="paris-sp-bread-sep">/</span>';
        echo '  <a href="' . esc_url($cat_link) . '" class="paris-sp-bread-cat">' . esc_html($cat_name) . '</a>';
    }
    echo '  <span class="paris-sp-bread-sep">/</span>';
    echo '  <span class="paris-sp-bread-current">' . esc_html($product->get_name()) . '</span>';
    echo '</div>';
}

// Trust perks under add to cart
add_action('woocommerce_single_product_summary', 'paris_single_product_trust_perks', 35);
function paris_single_product_trust_perks() {
    ?>
    <div class="paris-sp-perks">
        <div class="paris-sp-perk-item">
            <span class="paris-sp-perk-icon">🚚</span>
            <div class="paris-sp-perk-text">
                <strong>شحن سريع</strong>
                <span>توصيل لكافة المحافظات</span>
            </div>
        </div>
        <div class="paris-sp-perk-item">
            <span class="paris-sp-perk-icon">🔍</span>
            <div class="paris-sp-perk-text">
                <strong>معاينة وفحص</strong>
                <span>عاين طلبك قبل الاستلام</span>
            </div>
        </div>
        <div class="paris-sp-perk-item">
            <span class="paris-sp-perk-icon">🔄</span>
            <div class="paris-sp-perk-text">
                <strong>استبدال سهل</strong>
                <span>ضمان الجودة والراحة</span>
            </div>
        </div>
    </div>
    <?php
}

// Related products count
add_filter('woocommerce_output_related_products_args', function($args) {
    $args['posts_per_page'] = 4;
    $args['columns'] = 4;
    return $args;
});

// Fallback for single product image if no media attachment
add_filter('woocommerce_single_product_image_thumbnail_html', function($html, $post_thumbnail_id) {
    global $product;
    if (! $product) return $html;
    if (! has_post_thumbnail($product->get_id())) {
        $ext_img = get_post_meta($product->get_id(), '_paris_external_img', true);
        if ($ext_img) {
            return sprintf(
                '<div class="woocommerce-product-gallery__image"><img src="%s" alt="%s" class="wp-post-image" /></div>',
                esc_url($ext_img),
                esc_attr($product->get_name())
            );
        }
    }
    return $html;
}, 10, 2);

// ============================================================
// 12. DEPARTMENT BADGES IN CART & CHECKOUT
// ============================================================
add_filter('woocommerce_cart_item_name', function($name, $cart_item, $cart_item_key) {
    if (!isset($cart_item['product_id'])) return $name;
    $product_id = $cart_item['product_id'];

    $is_home = false;
    if (class_exists('PWO_Message')) {
        $is_home = PWO_Message::is_home_product($product_id);
    } else {
        $home_slugs = ['home', 'kitchen', 'decor', 'textiles', 'cleaning', 'organization', 'appliances', 'cookware'];
        $terms      = get_the_terms($product_id, 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $term) {
                if (in_array($term->slug, $home_slugs, true)) {
                    $is_home = true;
                    break;
                }
            }
        }
    }

    $badge = $is_home
        ? '<span class="paris-cart-dept-badge home" title="منتج من فرع الأدوات المنزلية">🏠 أدوات منزلية</span>'
        : '<span class="paris-cart-dept-badge clothes" title="منتج من فرع الملابس">👗 ملابس</span>';

    return $name . ' ' . $badge;
}, 10, 3);

// ============================================================
// 13. AMAZON-STYLE SELECTIVE CART & CHECKOUT
// ============================================================
add_action( 'wp_ajax_paris_save_cart_selection', 'paris_ajax_save_cart_selection' );
add_action( 'wp_ajax_nopriv_paris_save_cart_selection', 'paris_ajax_save_cart_selection' );
function paris_ajax_save_cart_selection() {
    check_ajax_referer( 'paris_cart_nonce', 'nonce' );

    $keys = isset( $_POST['selected_keys'] ) && is_array( $_POST['selected_keys'] )
        ? array_map( 'sanitize_text_field', $_POST['selected_keys'] )
        : [];

    if ( WC()->session ) {
        WC()->session->set( 'paris_cart_selected_keys', $keys );
    }

    wp_send_json_success( [ 'count' => count( $keys ) ] );
}

function paris_filter_cart_items_on_checkout() {
    if ( ! WC()->session ) return;

    $selected_keys = WC()->session->get( 'paris_cart_selected_keys' );
    if ( ! is_array( $selected_keys ) ) return;

    $cart = WC()->cart;
    if ( ! $cart || $cart->is_empty() ) return;

    $saved_items = WC()->session->get( 'paris_saved_for_later', [] );
    if ( ! is_array( $saved_items ) ) $saved_items = [];
    $modified    = false;

    foreach ( $cart->get_cart() as $cart_item_key => $cart_item ) {
        if ( ! in_array( $cart_item_key, $selected_keys, true ) ) {
            $saved_items[ $cart_item_key ] = [
                'product_id'     => $cart_item['product_id'],
                'quantity'       => $cart_item['quantity'],
                'variation_id'   => $cart_item['variation_id'] ?? 0,
                'variation'      => $cart_item['variation'] ?? [],
                'cart_item_data' => array_diff_key( $cart_item, array_flip( [
                    'product_id', 'variation_id', 'variation', 'quantity', 'data',
                    'line_total', 'line_subtotal', 'line_tax', 'line_subtotal_tax'
                ] ) ),
            ];
            $cart->remove_cart_item( $cart_item_key );
            $modified = true;
        }
    }

    if ( $modified ) {
        WC()->session->set( 'paris_saved_for_later', $saved_items );
        $cart->calculate_totals();
    }
}

add_action( 'template_redirect', function () {
    if ( ! WC()->session ) return;

    // 1. إذا كان في صفحة السلة، استعد أي عناصر محفوظة فوراً
    if ( function_exists( 'is_cart' ) && is_cart() ) {
        paris_restore_unselected_cart_items();
        return;
    }

    // 2. إذا كان في صفحة الدفع (وليس صفحة الاستلام)
    if ( function_exists( 'is_checkout' ) && is_checkout() && ! is_order_received_page() ) {
        paris_filter_cart_items_on_checkout();
    }
}, 5 );

add_action( 'woocommerce_checkout_init', 'paris_filter_cart_items_on_checkout', 5 );
add_action( 'woocommerce_before_checkout_process', 'paris_filter_cart_items_on_checkout', 5 );


function paris_restore_unselected_cart_items() {
    if ( ! WC()->session ) return;
    $saved_items = WC()->session->get( 'paris_saved_for_later' );
    if ( ! empty( $saved_items ) && is_array( $saved_items ) ) {
        $unselected_new_keys = [];
        foreach ( $saved_items as $item ) {
            $new_key = WC()->cart->add_to_cart(
                $item['product_id'],
                $item['quantity'],
                $item['variation_id'] ?? 0,
                $item['variation'] ?? [],
                $item['cart_item_data'] ?? []
            );
            if ( $new_key ) {
                $unselected_new_keys[] = $new_key;
            }
        }
        WC()->session->__unset( 'paris_saved_for_later' );

        $selected_keys = WC()->session->get( 'paris_cart_selected_keys', [] );
        if ( is_array( $selected_keys ) ) {
            $selected_keys = array_values( array_diff( $selected_keys, $unselected_new_keys ) );
            WC()->session->set( 'paris_cart_selected_keys', $selected_keys );
        }
    }
}

add_action( 'woocommerce_thankyou', function ( $order_id ) {
    paris_restore_unselected_cart_items();
}, 5 );

add_action( 'woocommerce_payment_complete', function ( $order_id ) {
    paris_restore_unselected_cart_items();
}, 5 );



