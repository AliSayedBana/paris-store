<?php
/**
 * =====================================================================
 * Paris Store — Theme Snippets (functions.php أو Code Snippets plugin)
 * =====================================================================
 * انسخ الأقسام اللي تحتاجها وضعها في:
 *   - ملف functions.php لقالبك الابن (Child Theme)
 *   - أو plugin "Code Snippets" (الأنظف والأأمن)
 *
 * لا تعدّل ملف functions.php للقالب الأصلي مباشرة!
 * =====================================================================
 */

// =======================================================================
// 1. تسجيل خطوط Cairo / Tajawal محلياً (بدل Google Fonts لسرعة أفضل)
// =======================================================================
// قبل استخدام هذا الكود:
//   - حمّل ملفات الخط من https://gwfh.mranftl.com/
//   - ارفعها على /wp-content/themes/CHILD-THEME/fonts/
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'paris-fonts',
        get_stylesheet_directory_uri() . '/fonts/cairo.css',
        [],
        '1.0'
    );
}, 5 );

// تطبيق الخط على الموقع كله
add_action( 'wp_head', function () {
    echo '<style>
        body, h1, h2, h3, h4, h5, h6, p, a, button, input, textarea, select, label {
            font-family: "Cairo", "Tajawal", Arial, sans-serif !important;
        }
    </style>';
} );


// =======================================================================
// 2. إزالة الكسور من أسعار WooCommerce (عرض 150 بدل 150.00)
// =======================================================================
add_filter( 'wc_get_price_decimals', fn() => 0 );


// =======================================================================
// 3. إخفاء المنتجات المنتهية من الأرشيف وإظهار شارة "نفد" في الصفحة
// =======================================================================
// ⚙️ حسب طلب صاحب المحل: يظهر بعلامة "نفد" بدل الإخفاء
add_filter( 'woocommerce_product_is_visible', function ( bool $visible, int $product_id ): bool {
    // أبقِ المنتج ظاهراً حتى لو نفد
    return true;
}, 10, 2 );

// إضافة شارة "نفد" فوق صورة المنتج في الأرشيف
add_filter( 'woocommerce_sale_flash', function ( string $html, \WP_Post $post, \WC_Product $product ): string {
    if ( ! $product->is_in_stock() ) {
        return '<span class="paris-badge paris-badge--outofstock">نفد</span>';
    }
    return $html;
}, 10, 3 );

// إضافة شارة "جديد" للمنتجات المضافة في آخر 30 يوم
add_action( 'woocommerce_before_shop_loop_item_title', function () {
    global $product;
    if ( ! $product instanceof \WC_Product ) return;

    $date_created = $product->get_date_created();
    if ( $date_created && ( time() - $date_created->getTimestamp() ) < ( 30 * DAY_IN_SECONDS ) ) {
        echo '<span class="paris-badge paris-badge--new">جديد</span>';
    }
}, 10 );

// CSS الشارات (يمكن نقله لملف style.css الخاص بالقالب الابن)
add_action( 'wp_head', function () {
    echo '<style>
        .paris-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-family: Cairo, sans-serif;
            font-size: .75rem;
            font-weight: 700;
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
        }
        .paris-badge--outofstock { background: #e53935; color: #fff; }
        .paris-badge--new        { background: #1e88e5; color: #fff; }
        .woocommerce span.onsale { right: auto; left: 8px; }
    </style>';
} );


// =======================================================================
// 4. تخصيص عملة الجنيه المصري
// =======================================================================
// (أضف هذا إذا لم تضبط العملة من WooCommerce > الإعدادات > العملة)
add_filter( 'woocommerce_currency', fn() => 'EGP' );
add_filter( 'woocommerce_currency_symbol', function ( string $symbol, string $currency ): string {
    return $currency === 'EGP' ? 'ج.م' : $symbol;
}, 10, 2 );


// =======================================================================
// 5. Product Schema (JSON-LD) لتحسين SEO
// =======================================================================
add_action( 'wp_footer', function () {
    if ( ! is_product() ) return;

    global $product;
    if ( ! $product instanceof \WC_Product ) return;

    $schema = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Product',
        'name'        => $product->get_name(),
        'description' => wp_strip_all_tags( $product->get_short_description() ?: $product->get_description() ),
        'sku'         => $product->get_sku(),
        'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'full' ) ?: '',
        'offers'      => [
            '@type'         => 'Offer',
            'priceCurrency' => 'EGP',
            'price'         => $product->get_price(),
            'availability'  => $product->is_in_stock()
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'url'           => get_permalink(),
        ],
        'brand' => [
            '@type' => 'Brand',
            'name'  => get_bloginfo( 'name' ),
        ],
    ];

    echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE ) . '</script>';
} );


// =======================================================================
// 6. إخفاء رابط wp-admin في صفحة تسجيل الدخول (طبقة أمان بسيطة)
// =======================================================================
// استخدم plugin WPS Hide Login لتغيير رابط الدخول بالكامل


// =======================================================================
// 7. تنظيف <head> من الـ meta غير الضرورية
// =======================================================================
remove_action( 'wp_head', 'wp_generator' );          // إخفاء إصدار WordPress
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );


// =======================================================================
// 8. RTL: ضمان اتجاه النص في صفحات WooCommerce
// =======================================================================
add_action( 'wp_head', function () {
    if ( ! function_exists( 'is_woocommerce' ) ) return;
    if ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() ) {
        echo '<style>
            .woocommerce, .woocommerce-page,
            .woocommerce form, .woocommerce .cart-collaterals,
            .woocommerce table { direction: rtl; text-align: right; }
        </style>';
    }
} );


// =======================================================================
// 9. تحديد صلاحيات "مدير المتجر" لرفع المنتجات فقط
// =======================================================================
// يُضاف دور مخصص — شغّله مرة واحدة فقط عبر Code Snippets أو functions.php
// ثم احذفه أو علّق عليه
/*
add_action( 'init', function () {
    if ( get_role( 'paris_product_manager' ) ) return; // لا تعيد الإنشاء

    add_role(
        'paris_product_manager',
        'مدير المنتجات',
        [
            'read'                   => true,
            'edit_posts'             => false,
            'manage_woocommerce'     => false,
            // صلاحيات المنتجات فقط:
            'edit_products'          => true,
            'edit_published_products'=> true,
            'publish_products'       => true,
            'upload_files'           => true,
        ]
    );
} );
*/

