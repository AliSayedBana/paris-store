<?php
/**
 * Plugin Name: Paris WhatsApp Orders
 * Plugin URI:  https://example.com
 * Description: يسجّل الطلب في WooCommerce أولاً ثم يحوّل الزبون لرسالة واتساب جاهزة للمحل.
 * Version:     1.0.0
 * Author:      Paris Store
 * Text Domain: paris-whatsapp-orders
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * WC requires at least: 8.0
 * WC tested up to: 9.9
 */

defined( 'ABSPATH' ) || exit;

define( 'PWO_VERSION', '1.0.0' );
define( 'PWO_PLUGIN_FILE', __FILE__ );
define( 'PWO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'PWO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// ── HPOS compatibility ──────────────────────────────────────────────────────
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            __FILE__,
            true
        );
    }
} );

// ── Bootstrap ────────────────────────────────────────────────────────────────
add_action( 'plugins_loaded', function () {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function () {
            echo '<div class="notice notice-error"><p>'
                . esc_html__( 'Paris WhatsApp Orders يتطلب تفعيل WooCommerce.', 'paris-whatsapp-orders' )
                . '</p></div>';
        } );
        return;
    }

    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-order-status.php';
    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-message.php';
    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-gateway.php';
    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-thankyou.php';
    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-admin-email.php';

    PWO_Order_Status::init();
    PWO_Thank_You::init();
    PWO_Admin_Email::init();

    // تسجيل بوابة الدفع
    add_filter( 'woocommerce_payment_gateways', function ( $gateways ) {
        $gateways[] = 'PWO_Gateway';
        return $gateways;
    } );

    // التأكيد البرمجي لتحويل AJAX إلى واتساب فوراً
    add_filter( 'woocommerce_payment_successful_result', function ( $result, $order_id ) {
        $order = wc_get_order( $order_id );
        if ( $order && $order->get_payment_method() === 'paris_whatsapp' ) {
            require_once PWO_PLUGIN_DIR . 'includes/class-pwo-message.php';
            $result['redirect'] = PWO_Message::get_whatsapp_url( $order );
        }
        return $result;
    }, 999, 2 );

    // تحويل فوري لواتساب عند وصول الزبون لصفحة استلام الطلب لمنع ظهور صفحة الشكر
    add_action( 'template_redirect', function () {
        if ( function_exists( 'is_order_received_page' ) && is_order_received_page() ) {
            global $wp;
            $order_id = isset( $wp->query_vars['order-received'] ) ? absint( $wp->query_vars['order-received'] ) : 0;
            if ( ! $order_id && isset( $_GET['order-received'] ) ) {
                $order_id = absint( $_GET['order-received'] );
            }
            if ( $order_id ) {
                $order = wc_get_order( $order_id );
                if ( $order && $order->get_payment_method() === 'paris_whatsapp' ) {
                    require_once PWO_PLUGIN_DIR . 'includes/class-pwo-message.php';
                    $wa_url = PWO_Message::get_whatsapp_url( $order );
                    wp_redirect( $wa_url );
                    exit;
                }
            }
        }
    }, 1 );
} );

