<?php
/**
 * بوابة دفع WooCommerce المخصصة — "تأكيد الطلب عبر واتساب"
 */
defined( 'ABSPATH' ) || exit;

class PWO_Gateway extends WC_Payment_Gateway {

    public function __construct() {
        $this->id                 = 'paris_whatsapp';
        $this->icon               = PWO_PLUGIN_URL . 'assets/images/whatsapp-icon.svg';
        $this->has_fields         = false;
        $this->method_title       = __( 'واتساب', 'paris-whatsapp-orders' );
        $this->method_description = __( 'الزبون يؤكد طلبه عبر واتساب، والدفع يتم خارج الموقع (فودافون كاش أو عند الاستلام).', 'paris-whatsapp-orders' );

        $this->init_form_fields();
        $this->init_settings();

        $this->title       = $this->get_option( 'title', 'تأكيد الطلب عبر واتساب 📲' );
        $this->description = $this->get_option(
            'description',
            'سيتم إرسال تفاصيل طلبك لنا على واتساب. سنتواصل معك لتأكيد التوفر وطريقة الدفع (فودافون كاش / عند الاستلام).'
        );
        $this->enabled = $this->get_option( 'enabled', 'yes' );

        add_action(
            'woocommerce_update_options_payment_gateways_' . $this->id,
            [ $this, 'process_payment_fields' ]
        );
    }

    public function get_icon(): string {
        $icon_url = PWO_PLUGIN_URL . 'assets/images/whatsapp-icon.svg';
        $icon = '<img src="' . esc_url( $icon_url ) . '" alt="' . esc_attr( $this->get_title() ) . '" class="pwo-gateway-icon" style="width:24px;height:24px;vertical-align:middle;margin:0 8px;display:inline-block;" />';
        return apply_filters( 'woocommerce_gateway_icon', $icon, $this->id );
    }

    // ── حقول الإعداد في لوحة WooCommerce ────────────────────────────────────
    public function init_form_fields(): void {
        $this->form_fields = [
            'enabled'          => [
                'title'   => __( 'تفعيل', 'paris-whatsapp-orders' ),
                'type'    => 'checkbox',
                'label'   => __( 'تفعيل بوابة واتساب', 'paris-whatsapp-orders' ),
                'default' => 'yes',
            ],
            'title'            => [
                'title'       => __( 'العنوان', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'يظهر للزبون عند إتمام الطلب.', 'paris-whatsapp-orders' ),
                'default'     => 'تأكيد الطلب عبر واتساب 📲',
                'desc_tip'    => true,
            ],
            'description'      => [
                'title'   => __( 'الوصف', 'paris-whatsapp-orders' ),
                'type'    => 'textarea',
                'default' => 'سيتم إرسال تفاصيل طلبك لنا على واتساب. سنتواصل معك لتأكيد التوفر وطريقة الدفع.',
            ],
            'whatsapp_number'  => [
                'title'       => __( 'رقم واتساب المحل', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'بالصيغة الدولية بدون + مثال: 201065968425', 'paris-whatsapp-orders' ),
                'default'     => '201065968425',
                'desc_tip'    => true,
                'placeholder' => '201XXXXXXXXX',
            ],
            'admin_email'      => [
                'title'       => __( 'إيميل الإشعارات', 'paris-whatsapp-orders' ),
                'type'        => 'email',
                'description' => __( 'يصله إشعار بكل طلب جديد كنسخة احتياطية.', 'paris-whatsapp-orders' ),
                'default'     => get_option( 'admin_email' ),
                'desc_tip'    => true,
            ],
            'redirect_delay'   => [
                'title'       => __( 'تأخير التحويل (ثواني)', 'paris-whatsapp-orders' ),
                'type'        => 'number',
                'description' => __( 'ثواني قبل فتح واتساب تلقائياً (0 = فوري).', 'paris-whatsapp-orders' ),
                'default'     => '2',
                'desc_tip'    => true,
                'custom_attributes' => [ 'min' => '0', 'max' => '10' ],
            ],
        ];
    }

    // حفظ الإعدادات في جدول مخصص (نفس اسم get_option الذي يستخدمه PWO_Message)
    public function process_payment_fields(): void {
        $this->process_admin_options();
        $opts = $this->settings;
        update_option( 'woocommerce_paris_whatsapp_settings', $opts );
    }

    // ── معالجة الدفع ─────────────────────────────────────────────────────────
    public function process_payment( $order_id ): array {
        $order = wc_get_order( $order_id );

        // ✅ تسجيل الطلب بحالة "بانتظار التأكيد"
        $order->update_status(
            'whatsapp-pending',
            __( 'الطلب بانتظار تأكيد الزبون عبر واتساب.', 'paris-whatsapp-orders' )
        );

        // تفريغ السلة
        WC()->cart->empty_cart();

        // ✅ إرجاع صفحة الشكر (التحويل لواتساب يتم من صفحة الشكر)
        return [
            'result'   => 'success',
            'redirect' => $this->get_return_url( $order ),
        ];
    }
}

