<?php
/**
 * Plugin Name: Paris Checkout Customizer
 * Plugin URI:  https://example.com
 * Description: يخصص نموذج إتمام الطلب: محافظات مصر، التحقق من الموبايل، إزالة الحقول غير الضرورية.
 * Version:     1.0.0
 * Author:      Paris Store
 * Text Domain: paris-checkout
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * WC requires at least: 8.0
 */

defined( 'ABSPATH' ) || exit;

// ── HPOS compatibility ───────────────────────────────────────────────────────
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
    }
} );

// ════════════════════════════════════════════════════════════════════════════
// 1. تعديل حقول نموذج الطلب
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_checkout_fields', function ( array $fields ): array {

    // ── حذف حقول غير مطلوبة ─────────────────────────────────────────────
    unset(
        $fields['billing']['billing_company'],
        $fields['billing']['billing_postcode'],
        $fields['billing']['billing_country'],   // مخفي (مصر دائماً)
        $fields['shipping']                      // لا نحتاج عنوان شحن منفصل
    );

    // ── الإيميل: اختياري وغير مطلوب ──────────────────────────────────────
    if ( isset( $fields['billing']['billing_email'] ) ) {
        $fields['billing']['billing_email']['required'] = false;
        $fields['billing']['billing_email']['label']    = __( 'البريد الإلكتروني (اختياري)', 'paris-checkout' );
        $fields['billing']['billing_email']['priority'] = 120; // في الآخر
    }

    // ── تخصيص حقل الاسم الأول ────────────────────────────────────────────
    $fields['billing']['billing_first_name']['label']       = __( 'الاسم بالكامل', 'paris-checkout' );
    $fields['billing']['billing_first_name']['placeholder'] = __( 'مثال: أحمد محمد علي', 'paris-checkout' );
    $fields['billing']['billing_first_name']['priority']    = 10;

    // حذف حقل الاسم الأخير (نجمعهما في الأول)
    unset( $fields['billing']['billing_last_name'] );

    // ── حقل رقم الموبايل ─────────────────────────────────────────────────
    $fields['billing']['billing_phone']['label']       = __( 'رقم الموبايل', 'paris-checkout' );
    $fields['billing']['billing_phone']['placeholder'] = '01XXXXXXXXX';
    $fields['billing']['billing_phone']['required']    = true;
    $fields['billing']['billing_phone']['priority']    = 20;

    // ── قائمة المحافظات ───────────────────────────────────────────────────
    $fields['billing']['billing_state']['label']    = __( 'المحافظة', 'paris-checkout' );
    $fields['billing']['billing_state']['required'] = true;
    $fields['billing']['billing_state']['priority'] = 30;

    // ── المنطقة/الحي (address_2) ──────────────────────────────────────────
    $fields['billing']['billing_address_2']['label']       = __( 'المنطقة / الحي', 'paris-checkout' );
    $fields['billing']['billing_address_2']['placeholder'] = __( 'مثال: المعادي، شارع النصر', 'paris-checkout' );
    $fields['billing']['billing_address_2']['required']    = false;
    $fields['billing']['billing_address_2']['priority']    = 40;

    // ── العنوان التفصيلي ─────────────────────────────────────────────────
    $fields['billing']['billing_address_1']['label']       = __( 'العنوان بالتفصيل', 'paris-checkout' );
    $fields['billing']['billing_address_1']['placeholder'] = __( 'رقم المبنى، الشارع، أقرب علامة مميزة', 'paris-checkout' );
    $fields['billing']['billing_address_1']['required']    = true;
    $fields['billing']['billing_address_1']['priority']    = 50;

    // المدينة: اختياري (محافظة كافية)
    $fields['billing']['billing_city']['required'] = false;
    $fields['billing']['billing_city']['label']    = __( 'المدينة / المركز (اختياري)', 'paris-checkout' );
    $fields['billing']['billing_city']['priority'] = 60;

    return $fields;
} );

// ════════════════════════════════════════════════════════════════════════════
// 2. تثبيت الدولة على مصر وإخفاء حقل الدولة
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'default_checkout_billing_country', fn() => 'EG' );
add_filter( 'woocommerce_countries_allowed_countries', function ( array $countries ): array {
    return [ 'EG' => $countries['EG'] ?? 'Egypt' ];
} );

// ════════════════════════════════════════════════════════════════════════════
// 3. التحقق من صيغة الموبايل المصري عند إرسال النموذج
// ════════════════════════════════════════════════════════════════════════════
add_action( 'woocommerce_checkout_process', function (): void {
    $phone = isset( $_POST['billing_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) ) : '';
    $phone = preg_replace( '/\s+/', '', $phone ); // إزالة المسافات

    if ( $phone === '' ) {
        wc_add_notice( __( 'رقم الموبايل مطلوب.', 'paris-checkout' ), 'error' );
        return;
    }

    // يقبل: 01XXXXXXXXX (11 رقم) أو 201XXXXXXXXX (12 رقم)
    if ( ! preg_match( '/^(01[0-2,5]{1}[0-9]{8}|201[0-2,5]{1}[0-9]{8})$/', $phone ) ) {
        wc_add_notice(
            __( 'رقم الموبايل غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويكون 11 رقماً.', 'paris-checkout' ),
            'error'
        );
    }
} );

// ════════════════════════════════════════════════════════════════════════════
// 4. إخفاء قسم "الشحن لعنوان مختلف"
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_cart_needs_shipping_address', '__return_false' );

// ════════════════════════════════════════════════════════════════════════════
// 5. ملاحظة توضيحية فوق نموذج الطلب
// ════════════════════════════════════════════════════════════════════════════
add_action( 'woocommerce_before_checkout_form', function (): void {
    echo '<div style="
        background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;
        padding:1rem 1.25rem;margin-bottom:1.5rem;
        font-family:Cairo,Tajawal,sans-serif;font-size:.95rem;
        direction:rtl;text-align:right;color:#2e7d32
    ">
        <strong>💡 كيف يتم الطلب؟</strong><br>
        أدخل بياناتك ثم اضغط <strong>"أكّد الطلب عبر واتساب"</strong>.<br>
        سنتواصل معك لتأكيد التوفر والشحن وطريقة الدفع (فودافون كاش أو عند الاستلام).
    </div>';
}, 5 );

// ════════════════════════════════════════════════════════════════════════════
// 6. تغيير نص زر الإرسال
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_order_button_text', fn() => '📲 أكّد الطلب عبر واتساب' );

