<?php
/**
 * Plugin Name: Paris Checkout Customizer
 * Plugin URI:  https://example.com
 * Description: تخصيص نموذج سلة المشتريات وإتمام الطلب: محافظات مصر، فحص الهاتف، تخطيط عصري، تأكيد الواتساب.
 * Version:     1.2.0
 * Author:      Paris Store
 * Text Domain: paris-checkout
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * WC requires at least: 8.0
 */

defined( 'ABSPATH' ) || exit;

// ── HPOS compatibility ────────────────────────────────────────────────────────
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
    }
} );

// ════════════════════════════════════════════════════════════════════════════
// 1. عنوان الصفحة الرئيسي (سلة المشتريات وإتمام الطلب)
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'the_title', function ( $title, $id = null ) {
    if ( ! is_admin() && function_exists( 'is_checkout' ) && is_checkout() && ! is_order_received_page() ) {
        if ( $id === (int) get_option( 'woocommerce_checkout_page_id' ) ) {
            return 'سلة المشتريات وإتمام الطلب';
        }
    }
    return $title;
}, 20, 2 );

// ════════════════════════════════════════════════════════════════════════════
// 2. تعديل حقول نموذج الطلب (تخطيط متناسق ونظيف)
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_checkout_fields', function ( array $fields ): array {

    // ── حذف حقول غير مطلوبة ──────────────────────────────────────────────
    unset(
        $fields['billing']['billing_company'],
        $fields['billing']['billing_postcode'],
        $fields['billing']['billing_country'],   // مخفي (مصر دائماً)
        $fields['billing']['billing_last_name'],  // نجمع الاسم في حقل واحد
        $fields['shipping']                      // لا نحتاج عنوان شحن منفصل
    );

    // 1. الاسم بالكامل *
    $fields['billing']['billing_first_name']['label']       = __( 'الاسم بالكامل', 'paris-checkout' );
    $fields['billing']['billing_first_name']['placeholder'] = __( 'مثال: علي محمد', 'paris-checkout' );
    $fields['billing']['billing_first_name']['required']    = true;
    $fields['billing']['billing_first_name']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_first_name']['priority']    = 10;

    // 2. رقم الموبايل *
    $fields['billing']['billing_phone']['label']       = __( 'رقم الموبايل', 'paris-checkout' );
    $fields['billing']['billing_phone']['placeholder'] = '01XXXXXXXXX';
    $fields['billing']['billing_phone']['required']    = true;
    $fields['billing']['billing_phone']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_phone']['priority']    = 20;

    // 3. المحافظة * (قائمة الـ 27 محافظة مصرية)
    $fields['billing']['billing_state']['label']       = __( 'المحافظة', 'paris-checkout' );
    $fields['billing']['billing_state']['required']    = true;
    $fields['billing']['billing_state']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_state']['priority']    = 30;
    $fields['billing']['billing_state']['default']     = 'EGKFS'; // كفر الشيخ افتراضياً

    // 4. بيتي (أو المنطقة)
    $fields['billing']['billing_address_2']['label']       = __( 'بيتي (أو المنطقة)', 'paris-checkout' );
    $fields['billing']['billing_address_2']['label_class'] = [];
    $fields['billing']['billing_address_2']['placeholder'] = __( 'مثال: وسط البلد / شارع النصر', 'paris-checkout' );
    $fields['billing']['billing_address_2']['required']    = false;
    $fields['billing']['billing_address_2']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_address_2']['priority']    = 40;

    // 5. العنوان بالتفصيل *
    $fields['billing']['billing_address_1']['label']       = __( 'العنوان بالتفصيل', 'paris-checkout' );
    $fields['billing']['billing_address_1']['placeholder'] = __( 'رقم المبنى، الشارع، أقرب علامة مميزة', 'paris-checkout' );
    $fields['billing']['billing_address_1']['required']    = true;
    $fields['billing']['billing_address_1']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_address_1']['priority']    = 50;

    // 6. المدينة / المركز (اختياري)
    $fields['billing']['billing_city']['label']       = __( 'المدينة / المركز (اختياري)', 'paris-checkout' );
    $fields['billing']['billing_city']['placeholder'] = __( 'مثال: كفر الشيخ / دسوق', 'paris-checkout' );
    $fields['billing']['billing_city']['required']    = false;
    $fields['billing']['billing_city']['class']       = [ 'form-row-wide' ];
    $fields['billing']['billing_city']['priority']    = 60;

    // 7. البريد الإلكتروني (اختياري)
    if ( isset( $fields['billing']['billing_email'] ) ) {
        $fields['billing']['billing_email']['label']       = __( 'البريد الإلكتروني (اختياري)', 'paris-checkout' );
        $fields['billing']['billing_email']['placeholder'] = 'name@example.com';
        $fields['billing']['billing_email']['required']    = false;
        $fields['billing']['billing_email']['class']       = [ 'form-row-wide' ];
        $fields['billing']['billing_email']['priority']    = 70;
    }

    // 8. ملاحظات الطلب (اختياري)
    if ( isset( $fields['order']['order_comments'] ) ) {
        $fields['order']['order_comments']['label']       = __( 'ملاحظات الطلب (اختياري)', 'paris-checkout' );
        $fields['order']['order_comments']['placeholder'] = __( 'أي ملاحظات خاصة بالتسليم أو مواعيد الاستلام...', 'paris-checkout' );
        $fields['order']['order_comments']['class']       = [ 'form-row-wide' ];
    }

    // توحيد جميع الحقول لتكون بعرض كامل 100% وإزالة أي تداخل
    foreach ( $fields['billing'] as $k => &$f ) {
        $f['class'] = [ 'form-row-wide' ];
    }

    return $fields;
} );

// ════════════════════════════════════════════════════════════════════════════
// 3. تثبيت الدولة على مصر وإخفاء حقل الدولة
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'default_checkout_billing_country', fn() => 'EG' );
add_filter( 'woocommerce_countries_allowed_countries', function ( array $countries ): array {
    return [ 'EG' => $countries['EG'] ?? 'Egypt' ];
} );

// ════════════════════════════════════════════════════════════════════════════
// 4. التحقق من صيغة الموبايل المصري عند إرسال النموذج
// ════════════════════════════════════════════════════════════════════════════
add_action( 'woocommerce_checkout_process', function (): void {
    $phone = isset( $_POST['billing_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) ) : '';
    $phone = preg_replace( '/\s+/', '', $phone );

    if ( $phone === '' ) {
        wc_add_notice( __( 'يرجى إدخال رقم الموبايل للتواصل وتأكيد الطلب.', 'paris-checkout' ), 'error' );
        return;
    }

    if ( ! preg_match( '/^(01[0-2,5]{1}[0-9]{8}|201[0-2,5]{1}[0-9]{8})$/', $phone ) ) {
        wc_add_notice(
            __( 'رقم الموبايل غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويكون 11 رقماً.', 'paris-checkout' ),
            'error'
        );
    }
} );

// ════════════════════════════════════════════════════════════════════════════
// 5. إخفاء قسم "الشحن لعنوان مختلف"
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_cart_needs_shipping_address', '__return_false' );

// ════════════════════════════════════════════════════════════════════════════
// 6. صندوق الإرشادات التوضيحية الأنيق أعلى الصفحة
// ════════════════════════════════════════════════════════════════════════════
add_action( 'woocommerce_before_checkout_form', function (): void {
    echo '<div class="paris-checkout-instruction-box">
        <div class="instruction-header">
            <span class="instruction-icon">💡</span>
            <strong class="instruction-title">كيف يتم الطلب؟</strong>
        </div>
        <p class="instruction-text">
            أدخل بياناتك ثم اضغط <strong>"أكّد الطلب عبر واتساب"</strong>.<br>
            سنتواصل معك لتأكيد التوفر والشحن وطريقة الدفع (فودافون كاش أو عند الاستلام).
        </p>
    </div>';
}, 5 );

// ════════════════════════════════════════════════════════════════════════════
// 7. استبدال رسالة عدم توفر الشحن بـ "سنتواصل معك لتأكيد التوفر والشحن"
// ════════════════════════════════════════════════════════════════════════════
add_filter( 'woocommerce_no_shipping_available_html', function () {
    return '<span class="paris-shipping-notice">سنتواصل معك لتأكيد التوفر والشحن</span>';
} );
add_filter( 'woocommerce_cart_no_shipping_available_html', function () {
    return '<span class="paris-shipping-notice">سنتواصل معك لتأكيد التوفر والشحن</span>';
} );

// إضافة وسيلة شحن افتراضية لتفادي أخطاء ووكومرس عند الحساب
add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {
    if ( empty( $rates ) ) {
        $rate = new WC_Shipping_Rate(
            'paris_contact_shipping',
            'سنتواصل معك لتأكيد التوفر والشحن',
            0,
            [],
            'paris_contact'
        );
        return [ 'paris_contact_shipping' => $rate ];
    }
    return $rates;
}, 100, 2 );

// ════════════════════════════════════════════════════════════════════════════
// 8. تخصيص نصوص العناوين والأزرار والخصوصية
// ════════════════════════════════════════════════════════════════════════════
// نص زر إرسال الطلب
add_filter( 'woocommerce_order_button_text', fn() => '💬 أكّد الطلب عبر واتساب' );

// إخفاء نص الخصوصية الإنجليزي الافتراضي لووكومرس
remove_action( 'woocommerce_checkout_terms_and_conditions', 'wc_checkout_privacy_policy_text', 20 );
add_filter( 'woocommerce_get_privacy_policy_text', '__return_empty_string' );

// إضافة النص المطمئن بالعربية تحت زر تأكيد الطلب
add_action( 'woocommerce_review_order_after_submit', function (): void {
    echo '<div class="paris-checkout-reassurance">
        <p class="reassurance-main">سيتم إرسال تفاصيل طلبك لنا على واتساب فوراً لتأكيد الحجز والتوصيل.</p>
        <p class="reassurance-legal">بياناتك الشخصية تُستخدم فقط لتجهيز وتوصيل طلبك طبقاً لـ <a href="#" target="_blank">سياسة الخصوصية</a>.</p>
    </div>';
} );

// تخصيص عناوين تفاصيل الفاتورة وطلبك عبر gettext
add_filter( 'gettext', function ( $translated, $text, $domain ) {
    if ( $domain === 'woocommerce' ) {
        if ( $text === 'Billing details' ) {
            return 'تفاصيل الفاتورة 📝';
        }
        if ( $text === 'Your order' ) {
            return 'طلبك';
        }
    }
    return $translated;
}, 20, 3 );
