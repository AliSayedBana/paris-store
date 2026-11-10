<?php
/**
 * حالات الطلب المخصصة
 */
defined( 'ABSPATH' ) || exit;

class PWO_Order_Status {

    public static function init(): void {
        add_action( 'init', [ __CLASS__, 'register_statuses' ] );
        add_filter( 'wc_order_statuses', [ __CLASS__, 'add_to_list' ] );
        add_filter( 'woocommerce_reports_order_statuses', [ __CLASS__, 'add_to_reports' ] );
    }

    public static function register_statuses(): void {
        // بانتظار التأكيد عبر واتساب
        register_post_status( 'wc-whatsapp-pending', [
            'label'                     => _x( 'بانتظار التأكيد', 'Order status', 'paris-whatsapp-orders' ),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            /* translators: %s: number of orders */
            'label_count'               => _n_noop(
                'بانتظار التأكيد <span class="count">(%s)</span>',
                'بانتظار التأكيد <span class="count">(%s)</span>',
                'paris-whatsapp-orders'
            ),
        ] );

        // تم التأكيد وجاري التجهيز
        register_post_status( 'wc-whatsapp-confirmed', [
            'label'                     => _x( 'تم التأكيد', 'Order status', 'paris-whatsapp-orders' ),
            'public'                    => true,
            'exclude_from_search'       => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
            'label_count'               => _n_noop(
                'تم التأكيد <span class="count">(%s)</span>',
                'تم التأكيد <span class="count">(%s)</span>',
                'paris-whatsapp-orders'
            ),
        ] );
    }

    public static function add_to_list( array $statuses ): array {
        $statuses['wc-whatsapp-pending']   = _x( 'بانتظار التأكيد', 'Order status', 'paris-whatsapp-orders' );
        $statuses['wc-whatsapp-confirmed'] = _x( 'تم التأكيد', 'Order status', 'paris-whatsapp-orders' );
        return $statuses;
    }

    public static function add_to_reports( array $statuses ): array {
        $statuses[] = 'whatsapp-pending';
        $statuses[] = 'whatsapp-confirmed';
        return $statuses;
    }
}

