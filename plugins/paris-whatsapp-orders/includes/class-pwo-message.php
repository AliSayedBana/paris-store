<?php
/**
 * بناء نص رسالة واتساب من بيانات الطلب
 */
defined( 'ABSPATH' ) || exit;

class PWO_Message {

    /**
     * ينشئ نص الرسالة الكاملة ويُرجعها URL-encoded جاهزة للإرسال.
     */
    public static function build( WC_Order $order ): string {
        $store_name = get_bloginfo( 'name' );
        $lines      = [];

        // ── العنوان ─────────────────────────────────────────────────────────
        $lines[] = '🛒 طلب جديد #' . $order->get_order_number() . ' — ' . $store_name;
        $lines[] = str_repeat( '─', 30 );

        // ── بيانات الزبون ────────────────────────────────────────────────────
        $full_name   = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
        $phone       = $order->get_billing_phone();
        $state       = $order->get_billing_state();   // كود المحافظة
        $state_label = self::get_state_label( $state );
        $address_1   = $order->get_billing_address_1();
        $address_2   = $order->get_billing_address_2(); // المنطقة
        $note        = $order->get_customer_note();

        $lines[] = '👤 الاسم: ' . $full_name;
        $lines[] = '📱 الموبايل: ' . $phone;
        $lines[] = '📍 المحافظة: ' . $state_label;

        if ( $address_2 ) {
            $lines[] = '🏘 المنطقة: ' . $address_2;
        }
        $lines[] = '🏠 العنوان: ' . $address_1;

        if ( $note ) {
            $lines[] = '📝 ملاحظات: ' . $note;
        }

        $lines[] = str_repeat( '─', 30 );

        // ── المنتجات ─────────────────────────────────────────────────────────
        $lines[] = '🛍 المنتجات:';
        foreach ( $order->get_items() as $item ) {
            /** @var WC_Order_Item_Product $item */
            $product    = $item->get_product();
            $name       = $item->get_name();
            $qty        = $item->get_quantity();
            $line_total = wc_price( $item->get_total() );

            // استخراج السمات (مقاس، لون، ...)
            $meta_parts = [];
            foreach ( $item->get_formatted_meta_data( '' ) as $meta ) {
                $meta_parts[] = wp_strip_all_tags( $meta->display_key ) . ': ' . wp_strip_all_tags( $meta->display_value );
            }
            $meta_str = $meta_parts ? ' (' . implode( ' | ', $meta_parts ) . ')' : '';

            // إزالة HTML من wc_price للرسالة النصية
            $price_plain = html_entity_decode( wp_strip_all_tags( $line_total ), ENT_QUOTES, 'UTF-8' );

            $lines[] = "• {$name}{$meta_str} × {$qty} = {$price_plain}";
        }

        $lines[] = str_repeat( '─', 30 );

        // ── الإجمالي ─────────────────────────────────────────────────────────
        $subtotal_plain = html_entity_decode(
            wp_strip_all_tags( wc_price( $order->get_subtotal() ) ),
            ENT_QUOTES,
            'UTF-8'
        );
        $shipping_plain = html_entity_decode(
            wp_strip_all_tags( wc_price( $order->get_shipping_total() ) ),
            ENT_QUOTES,
            'UTF-8'
        );
        $total_plain    = html_entity_decode(
            wp_strip_all_tags( wc_price( $order->get_total() ) ),
            ENT_QUOTES,
            'UTF-8'
        );

        $lines[] = '💰 إجمالي المنتجات: ' . $subtotal_plain;
        $lines[] = '🚚 الشحن: ' . $shipping_plain;
        $lines[] = '✅ الإجمالي الكلي: ' . $total_plain;
        $lines[] = '';
        $lines[] = '🔗 رابط الطلب: ' . $order->get_edit_order_url();
        $lines[] = '';
        $lines[] = '_يُرجى التأكيد وتحديد طريقة الدفع (فودافون كاش / عند الاستلام)_';

        $text = implode( "\n", $lines );

        return rawurlencode( $text );
    }

    /**
     * يُنشئ رابط wa.me الكامل.
     */
    public static function get_whatsapp_url( WC_Order $order ): string {
        $options = get_option( 'woocommerce_paris_whatsapp_settings', [] );
        $number  = ! empty( $options['whatsapp_number'] )
            ? preg_replace( '/\D/', '', $options['whatsapp_number'] )
            : '201065968425';

        return 'https://wa.me/' . $number . '?text=' . self::build( $order );
    }

    // ── مساعد: اسم المحافظة من الكود ──────────────────────────────────────
    private static function get_state_label( string $code ): string {
        $states = WC()->countries->get_states( 'EG' );
        return $states[ $code ] ?? $code;
    }
}

