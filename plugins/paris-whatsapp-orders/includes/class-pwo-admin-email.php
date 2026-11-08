<?php
/**
 * إشعار إيميل للإدارة عند كل طلب جديد
 */
defined( 'ABSPATH' ) || exit;

class PWO_Admin_Email {

    public static function init(): void {
        add_action( 'woocommerce_order_status_whatsapp-pending', [ __CLASS__, 'send' ], 10, 2 );
    }

    public static function send( int $order_id, WC_Order $order ): void {
        $options     = get_option( 'woocommerce_paris_whatsapp_settings', [] );
        $admin_email = ! empty( $options['admin_email'] )
            ? sanitize_email( $options['admin_email'] )
            : get_option( 'admin_email' );

        if ( ! is_email( $admin_email ) ) {
            return;
        }

        $store_name  = get_bloginfo( 'name' );
        $order_num   = $order->get_order_number();
        $customer    = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
        $phone       = $order->get_billing_phone();
        $states      = WC()->countries->get_states( 'EG' );
        $state_label = $states[ $order->get_billing_state() ] ?? $order->get_billing_state();
        $total       = html_entity_decode( wp_strip_all_tags( wc_price( $order->get_total() ) ), ENT_QUOTES, 'UTF-8' );
        $edit_url    = $order->get_edit_order_url();

        $subject = sprintf( '[%s] طلب جديد #%s — %s', $store_name, $order_num, $customer );

        // ── بناء جدول المنتجات ──────────────────────────────────────────────
        $items_html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;direction:rtl">'
            . '<thead style="background:#25D366;color:#fff">'
            . '<tr><th>المنتج</th><th>الكمية</th><th>الإجمالي</th></tr>'
            . '</thead><tbody>';

        foreach ( $order->get_items() as $item ) {
            $name  = esc_html( $item->get_name() );
            $qty   = esc_html( $item->get_quantity() );
            $total_item = html_entity_decode( wp_strip_all_tags( wc_price( $item->get_total() ) ), ENT_QUOTES, 'UTF-8' );

            // السمات
            $metas = [];
            foreach ( $item->get_formatted_meta_data( '' ) as $meta ) {
                $metas[] = wp_strip_all_tags( $meta->display_key ) . ': ' . wp_strip_all_tags( $meta->display_value );
            }
            $meta_str = $metas ? '<br><small style="color:#666">' . esc_html( implode( ' | ', $metas ) ) . '</small>' : '';

            $items_html .= "<tr><td>{$name}{$meta_str}</td><td style='text-align:center'>{$qty}</td><td>{$total_item}</td></tr>";
        }
        $items_html .= '</tbody></table>';

        // ── نص الإيميل ──────────────────────────────────────────────────────
        $body = '
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
            <div style="background:#128C7E;color:#fff;padding:20px 24px">
                <h2 style="margin:0">🛒 طلب جديد #' . esc_html( $order_num ) . '</h2>
                <p style="margin:4px 0 0">' . esc_html( $store_name ) . '</p>
            </div>
            <div style="padding:24px">
                <table style="width:100%;direction:rtl;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#555;width:120px">الاسم</td><td><strong>' . esc_html( $customer ) . '</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#555">الموبايل</td><td><strong>' . esc_html( $phone ) . '</strong></td></tr>
                    <tr><td style="padding:6px 0;color:#555">المحافظة</td><td>' . esc_html( $state_label ) . '</td></tr>
                    <tr><td style="padding:6px 0;color:#555">العنوان</td><td>' . esc_html( $order->get_billing_address_1() ) . '</td></tr>
                    <tr><td style="padding:6px 0;color:#555">الإجمالي</td><td><strong style="font-size:1.1em;color:#128C7E">' . esc_html( $total ) . '</strong></td></tr>
                </table>
                <br>
                ' . $items_html . '
                <br>
                <a href="' . esc_url( $edit_url ) . '" style="display:inline-block;background:#128C7E;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                    عرض الطلب في اللوحة
                </a>
            </div>
        </div>';

        add_filter( 'wp_mail_content_type', fn() => 'text/html' );
        wp_mail( $admin_email, $subject, $body );
        remove_filter( 'wp_mail_content_type', fn() => 'text/html' );
    }
}

