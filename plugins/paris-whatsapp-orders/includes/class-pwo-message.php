<?php
/**
 * بناء نص رسالة واتساب من بيانات الطلب وتحديد أرقام الأقسام (ملابس / أدوات منزلية)
 */
defined( 'ABSPATH' ) || exit;

class PWO_Message {

    /**
     * فحص هل المنتج ينتمي لمول الأدوات المنزلية
     */
    public static function is_home_product( int $product_id ): bool {
        $home_slugs = [ 'home', 'kitchen', 'decor', 'textiles', 'cleaning', 'organization', 'appliances', 'cookware' ];
        $terms      = get_the_terms( $product_id, 'product_cat' );
        if ( ! $terms || is_wp_error( $terms ) ) {
            return false;
        }

        $home_term = get_term_by( 'slug', 'home', 'product_cat' );
        $home_id   = ( $home_term && ! is_wp_error( $home_term ) ) ? (int) $home_term->term_id : 0;

        foreach ( $terms as $term ) {
            if ( in_array( $term->slug, $home_slugs, true ) ) {
                return true;
            }
            if ( $home_id && in_array( $home_id, array_map( 'intval', get_ancestors( $term->term_id, 'product_cat' ) ), true ) ) {
                return true;
            }
        }
        return false;
    }

    /**
     * تحليل عناصر الطلب وتقسيمها إلى ملابس وأدوات منزلية
     */
    public static function analyze_order_departments( WC_Order $order ): array {
        $clothes_items = [];
        $home_items    = [];

        foreach ( $order->get_items() as $item_id => $item ) {
            /** @var WC_Order_Item_Product $item */
            $product_id = $item->get_product_id();
            if ( self::is_home_product( $product_id ) ) {
                $home_items[ $item_id ] = $item;
            } else {
                $clothes_items[ $item_id ] = $item;
            }
        }

        $has_clothes = ! empty( $clothes_items );
        $has_home    = ! empty( $home_items );

        $type = 'clothes';
        if ( $has_clothes && $has_home ) {
            $type = 'mixed';
        } elseif ( $has_home ) {
            $type = 'home';
        }

        return [
            'type'    => $type,
            'clothes' => $clothes_items,
            'home'    => $home_items,
        ];
    }

    /**
     * استخراج رقم الواتساب المناسب للقسم
     */
    public static function get_department_number( string $dept = 'clothes' ): string {
        $options = get_option( 'woocommerce_paris_whatsapp_settings', [] );
        $pwb     = get_option( 'pwb_options', [] );

        // أولاً: البحث في إعدادات البوابة PWO
        if ( $dept === 'home' ) {
            $num = ! empty( $options['whatsapp_number_home'] )
                ? $options['whatsapp_number_home']
                : ( ! empty( $pwb['whatsapp_number_home'] ) ? $pwb['whatsapp_number_home'] : ( $options['whatsapp_number'] ?? '201065968425' ) );
        } else {
            $num = ! empty( $options['whatsapp_number_clothes'] )
                ? $options['whatsapp_number_clothes']
                : ( ! empty( $pwb['whatsapp_number_clothes'] ) ? $pwb['whatsapp_number_clothes'] : ( $options['whatsapp_number'] ?? '201065968425' ) );
        }

        return preg_replace( '/\D/', '', (string) $num );
    }

    /**
     * ينشئ نص الرسالة (لقسم محدد أو للطلب ككل)
     */
    public static function build( WC_Order $order, string $dept = 'all', ?array $items_override = null ): string {
        $store_name = get_bloginfo( 'name' );
        $lines      = [];

        // ── العنوان وتحديد الفرع ─────────────────────────────
        if ( $dept === 'clothes' ) {
            $lines[] = '👗 طلب جديد — مول الملابس | ' . $store_name;
        } elseif ( $dept === 'home' ) {
            $lines[] = '🏠 طلب جديد — مول الأدوات المنزلية | ' . $store_name;
        } else {
            $lines[] = '🛒 طلب جديد #' . $order->get_order_number() . ' — ' . $store_name;
        }

        $lines[] = 'رقم الطلب: #' . $order->get_order_number();
        $lines[] = str_repeat( '─', 30 );

        // ── بيانات العميل ──────────────────────────────────
        $full_name   = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
        $phone       = $order->get_billing_phone();
        $state       = $order->get_billing_state();
        $state_label = self::get_state_label( $state );
        $address_1   = $order->get_billing_address_1();
        $address_2   = $order->get_billing_address_2();
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

        // ── المنتجات ───────────────────────────────────────
        $items = $items_override !== null ? $items_override : $order->get_items();
        $lines[] = '📦 المنتجات المطلوبة:';
        $subtotal_dept = 0;

        foreach ( $items as $item ) {
            /** @var WC_Order_Item_Product $item */
            $name       = $item->get_name();
            $qty        = $item->get_quantity();
            $line_total = $item->get_total();
            $subtotal_dept += $line_total;

            $meta_parts = [];
            foreach ( $item->get_formatted_meta_data( '' ) as $meta ) {
                $meta_parts[] = wp_strip_all_tags( $meta->display_key ) . ': ' . wp_strip_all_tags( $meta->display_value );
            }
            $meta_str = $meta_parts ? ' (' . implode( ' | ', $meta_parts ) . ')' : '';

            $price_formatted = html_entity_decode( wp_strip_all_tags( wc_price( $line_total ) ), ENT_QUOTES, 'UTF-8' );
            $lines[] = "• {$name}{$meta_str} × {$qty} = {$price_formatted}";
        }

        $lines[] = str_repeat( '─', 30 );

        // ── الحسابات والإجمالي ──────────────────────────────
        if ( $items_override !== null && count( $items ) < count( $order->get_items() ) ) {
            // طلب مجزأ لقسم محدد من طلب كلي
            $dept_name = ( $dept === 'home' ) ? 'الأدوات المنزلية' : 'الملابس';
            $lines[] = '💰 مجموع منتجات قسم ' . $dept_name . ': ' . html_entity_decode( wp_strip_all_tags( wc_price( $subtotal_dept ) ), ENT_QUOTES, 'UTF-8' );
            $lines[] = '🚚 مصاريف الشحن الكلية للطلب: ' . html_entity_decode( wp_strip_all_tags( wc_price( $order->get_shipping_total() ) ), ENT_QUOTES, 'UTF-8' );
            $lines[] = 'ℹ️ ملاحظة: هذا الطلب يخص ' . $dept_name . ' (ضمن طلب مجمّع رقم #' . $order->get_order_number() . ')';
        } else {
            // طلب لقسم واحد كامل
            $subtotal_plain = html_entity_decode( wp_strip_all_tags( wc_price( $order->get_subtotal() ) ), ENT_QUOTES, 'UTF-8' );
            $shipping_plain = html_entity_decode( wp_strip_all_tags( wc_price( $order->get_shipping_total() ) ), ENT_QUOTES, 'UTF-8' );
            $total_plain    = html_entity_decode( wp_strip_all_tags( wc_price( $order->get_total() ) ), ENT_QUOTES, 'UTF-8' );

            $lines[] = '💰 إجمالي المنتجات: ' . $subtotal_plain;
            $lines[] = '🚚 الشحن: ' . $shipping_plain;
            $lines[] = '✅ الإجمالي الكلي: ' . $total_plain;
        }

        $lines[] = '';
        $lines[] = '_يُرجى تأكيد الطلب وتحديد موعد الشحن والاستلام_';

        $text = implode( "\n", $lines );

        return rawurlencode( $text );
    }

    /**
     * ينشئ رابط wa.me مخصص لقسم معين أو عام
     */
    public static function get_whatsapp_url_for_dept( WC_Order $order, string $dept ): string {
        $analysis = self::analyze_order_departments( $order );
        $items    = ( $dept === 'home' ) ? $analysis['home'] : $analysis['clothes'];
        $number   = self::get_department_number( $dept );

        return 'https://wa.me/' . $number . '?text=' . self::build( $order, $dept, $items );
    }

    /**
     * ينشئ رابط wa.me الافتراضي للطلب ككل
     */
    public static function get_whatsapp_url( WC_Order $order ): string {
        $analysis = self::analyze_order_departments( $order );
        if ( $analysis['type'] === 'home' ) {
            return self::get_whatsapp_url_for_dept( $order, 'home' );
        } elseif ( $analysis['type'] === 'clothes' ) {
            return self::get_whatsapp_url_for_dept( $order, 'clothes' );
        }

        // إذا كان مختلطاً، افتراضياً يحول لملابس
        return self::get_whatsapp_url_for_dept( $order, 'clothes' );
    }

    private static function get_state_label( string $code ): string {
        $states = WC()->countries->get_states( 'EG' );
        return $states[ $code ] ?? $code;
    }
}
