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
        $this->method_description = __( 'الزبون يؤكد طلبه عبر واتساب، مع توجيه ذكي لرقم محل الملابس أو رقم محل الأدوات المنزلية.', 'paris-whatsapp-orders' );

        $this->init_form_fields();
        $this->init_settings();

        $this->title       = $this->get_option( 'title', 'تأكيد الطلب عبر واتساب 📱' );
        $this->description = $this->get_option(
            'description',
            'سيتم إرسال تفاصيل طلبك مباشرة للفرع المختص على واتساب لتأكيد التوفر والشحن الفوري.'
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

    // ── حقول الإعداد في لوحة تحكم WooCommerce ──────────────────────────────
    public function init_form_fields(): void {
        $this->form_fields = [
            'enabled'                  => [
                'title'   => __( 'تفعيل', 'paris-whatsapp-orders' ),
                'type'    => 'checkbox',
                'label'   => __( 'تفعيل بوابة واتساب', 'paris-whatsapp-orders' ),
                'default' => 'yes',
            ],
            'title'                    => [
                'title'       => __( 'العنوان', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'يظهر للزبون عند إتمام الطلب.', 'paris-whatsapp-orders' ),
                'default'     => 'تأكيد الطلب عبر واتساب 📱',
                'desc_tip'    => true,
            ],
            'description'              => [
                'title'   => __( 'الوصف', 'paris-whatsapp-orders' ),
                'type'    => 'textarea',
                'default' => 'سيتم إرسال تفاصيل طلبك مباشرة للفرع المختص على واتساب لتأكيد التوفر والشحن الفوري.',
            ],
            'whatsapp_number_clothes'  => [
                'title'       => __( 'رقم واتساب مول الملابس 👗', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'رقم واتساب فرع الملابس بالصيغة الدولية بدون + (مثال: 201065968425)', 'paris-whatsapp-orders' ),
                'default'     => '201065968425',
                'desc_tip'    => true,
                'placeholder' => '201XXXXXXXXX',
            ],
            'whatsapp_number_home'     => [
                'title'       => __( 'رقم واتساب مول الأدوات المنزلية 🏠', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'رقم واتساب فرع الأدوات المنزلية بالصيغة الدولية بدون + (مثال: 201065968425)', 'paris-whatsapp-orders' ),
                'default'     => '201065968425',
                'desc_tip'    => true,
                'placeholder' => '201XXXXXXXXX',
            ],
            'whatsapp_number'          => [
                'title'       => __( 'الرقم الاحتياطي / الإدارة', 'paris-whatsapp-orders' ),
                'type'        => 'text',
                'description' => __( 'يستخدم كاحتياطي في حال عدم تعيين رقم للقسم.', 'paris-whatsapp-orders' ),
                'default'     => '201065968425',
                'desc_tip'    => true,
                'placeholder' => '201XXXXXXXXX',
            ],
            'admin_email'              => [
                'title'       => __( 'إيميل الإشعارات', 'paris-whatsapp-orders' ),
                'type'        => 'email',
                'description' => __( 'يصله إشعار بكل طلب جديد كنسخة احتياطية.', 'paris-whatsapp-orders' ),
                'default'     => get_option( 'admin_email' ),
                'desc_tip'    => true,
            ],
            'redirect_delay'           => [
                'title'       => __( 'تأخير التحويل (ثواني)', 'paris-whatsapp-orders' ),
                'type'        => 'number',
                'description' => __( 'ثواني قبل فتح واتساب تلقائياً للطلبات الفردية (0 = فوري).', 'paris-whatsapp-orders' ),
                'default'     => '0',
                'desc_tip'    => true,
                'custom_attributes' => [ 'min' => '0', 'max' => '10' ],
            ],
        ];
    }

    public function process_payment_fields(): void {
        $this->process_admin_options();
        $opts = $this->settings;
        update_option( 'woocommerce_paris_whatsapp_settings', $opts );
    }

    // ── معالجة الدفع ────────────────────────────────────────────────────────
    public function process_payment( $order_id ): array {
        $order = wc_get_order( $order_id );

        // تسجيل الطلب بحالة "بانتظار التأكيد"
        $order->update_status(
            'whatsapp-pending',
            __( 'الطلب بانتظار تأكيد الزبون عبر واتساب.', 'paris-whatsapp-orders' )
        );

        // حفظ نسخة كاملة من السلة في الجلسة للحفاظ على المنتجات في كل الأحوال
        // لا نفرغ السلة هنا إطلاقاً — السلة تظل موجودة حتى يضغط الزبون على إرسال الواتساب فعلياً
        if ( WC()->cart && ! WC()->cart->is_empty() && WC()->session ) {
            $cart_backup = [];
            foreach ( WC()->cart->get_cart() as $key => $item ) {
                $cart_backup[ $key ] = [
                    'product_id'     => $item['product_id'],
                    'quantity'       => $item['quantity'],
                    'variation_id'   => $item['variation_id'] ?? 0,
                    'variation'      => $item['variation'] ?? [],
                    'cart_item_data' => array_diff_key( $item, array_flip( [
                        'product_id', 'variation_id', 'variation', 'quantity', 'data',
                        'line_total', 'line_subtotal', 'line_tax', 'line_subtotal_tax'
                    ] ) ),
                ];
            }
            WC()->session->set( 'paris_preserved_cart', $cart_backup );
            WC()->session->set( 'pwo_cart_guardian_backup', $cart_backup );
        }

        require_once dirname( __FILE__ ) . '/class-pwo-message.php';
        $analysis = PWO_Message::analyze_order_departments( $order );

        // إذا كان الطلب مختلطاً (ملابس + أدوات): نوجهه لصفحة تأكيد الطلب المقسمة
        if ( $analysis['type'] === 'mixed' ) {
            return [
                'result'   => 'success',
                'redirect' => $order->get_checkout_order_received_url(),
            ];
        }

        // إذا كان الطلب لقسم واحد: تحويل مباشر لواتساب الفرع، ولا نفرغ السلة
        $whatsapp_url = PWO_Message::get_whatsapp_url_for_dept( $order, $analysis['type'] );

        return [
            'result'   => 'success',
            'redirect' => $whatsapp_url,
        ];
    }
}
