<?php
/**
 * صفحة الشكر — التحويل التلقائي للطلبات الفردية أو العرض المقسم للطلبات المختلطة مع حارس السلة
 */
defined( 'ABSPATH' ) || exit;

class PWO_Thank_You {

    public static $allow_cart_empty = false;
    private static $cart_in_memory_backup = null;

    public static function init(): void {
        add_action( 'woocommerce_thankyou_paris_whatsapp', [ __CLASS__, 'render' ], 1 );

        // 1. حارس السلة: منع تفريغ السلة تلقائياً عند تأكيد الطلب أو زيارة صفحة الشكر
        add_action( 'woocommerce_before_cart_emptied', [ __CLASS__, 'on_before_cart_emptied' ], 1 );
        add_action( 'woocommerce_cart_emptied', [ __CLASS__, 'on_cart_emptied' ], 999 );

        // 2. إخفاء جداول WooCommerce الافتراضية
        add_action( 'template_redirect', function () {
            if ( function_exists( 'is_order_received_page' ) && is_order_received_page() ) {
                remove_action( 'woocommerce_thankyou', 'woocommerce_order_details_table', 10 );
                self::ensure_cart_preserved();
            }
        } );

        // 3. استعادة السلة في صفحة الشكر للتأكد بنسبة 100%
        add_action( 'woocommerce_thankyou', [ __CLASS__, 'ensure_cart_preserved' ], 1 );

        // 4. معالج AJAX لتفريغ قسم محدد من السلة فقط عند ضغط الزبون على زر الواتساب الخاص به
        add_action( 'wp_ajax_pwo_confirm_department_sent', [ __CLASS__, 'ajax_confirm_department_sent' ] );
        add_action( 'wp_ajax_nopriv_pwo_confirm_department_sent', [ __CLASS__, 'ajax_confirm_department_sent' ] );
    }

    public static function on_before_cart_emptied( $clear_persistent_cart = true ): void {
        if ( ! self::$allow_cart_empty && WC()->cart && ! WC()->cart->is_empty() ) {
            self::$cart_in_memory_backup = WC()->cart->get_cart();
            if ( WC()->session ) {
                WC()->session->set( 'pwo_cart_guardian_backup', self::$cart_in_memory_backup );
                WC()->session->set( 'paris_preserved_cart', self::$cart_in_memory_backup );
            }
        }
    }

    public static function on_cart_emptied( $clear_persistent_cart = true ): void {
        if ( ! self::$allow_cart_empty ) {
            $backup = self::$cart_in_memory_backup;
            if ( empty( $backup ) && WC()->session ) {
                $backup = WC()->session->get( 'pwo_cart_guardian_backup' );
            }
            if ( empty( $backup ) && WC()->session ) {
                $backup = WC()->session->get( 'paris_preserved_cart' );
            }
            if ( ! empty( $backup ) && is_array( $backup ) && WC()->cart ) {
                WC()->cart->cart_contents = $backup;
                WC()->cart->set_session();
                WC()->cart->calculate_totals();
                if ( is_user_logged_in() && WC()->cart->session && method_exists( WC()->cart->session, 'persistent_cart_update' ) ) {
                    WC()->cart->session->persistent_cart_update();
                }
            }
        }
    }

    public static function ensure_cart_preserved(): void {
        if ( ! WC()->session || ! WC()->cart ) return;

        if ( WC()->cart->is_empty() ) {
            $backup = WC()->session->get( 'pwo_cart_guardian_backup' );
            if ( empty( $backup ) ) {
                $backup = WC()->session->get( 'paris_preserved_cart' );
            }
            if ( ! empty( $backup ) && is_array( $backup ) ) {
                foreach ( $backup as $item ) {
                    WC()->cart->add_to_cart(
                        $item['product_id'],
                        $item['quantity'],
                        $item['variation_id'] ?? 0,
                        $item['variation'] ?? [],
                        $item['cart_item_data'] ?? []
                    );
                }
                WC()->cart->set_session();
                WC()->cart->calculate_totals();
                if ( is_user_logged_in() && WC()->cart->session && method_exists( WC()->cart->session, 'persistent_cart_update' ) ) {
                    WC()->cart->session->persistent_cart_update();
                }
            }
        }
    }

    /**
     * تفريغ قسم محدد من السلة فقط بعد ضغط الزبون على زر الواتساب
     */
    public static function ajax_confirm_department_sent(): void {
        $dept = isset( $_POST['dept'] ) ? sanitize_text_field( $_POST['dept'] ) : '';

        require_once dirname( __FILE__ ) . '/class-pwo-message.php';

        self::$allow_cart_empty = true;

        if ( WC()->cart && ! WC()->cart->is_empty() ) {
            foreach ( WC()->cart->get_cart() as $cart_item_key => $item ) {
                $is_home = PWO_Message::is_home_product( (int) $item['product_id'] );
                if ( $dept === 'clothes' && ! $is_home ) {
                    WC()->cart->remove_cart_item( $cart_item_key );
                } elseif ( $dept === 'home' && $is_home ) {
                    WC()->cart->remove_cart_item( $cart_item_key );
                } elseif ( $dept === 'all' ) {
                    WC()->cart->remove_cart_item( $cart_item_key );
                }
            }
            WC()->cart->set_session();
            WC()->cart->calculate_totals();
            if ( is_user_logged_in() && WC()->cart->session && method_exists( WC()->cart->session, 'persistent_cart_update' ) ) {
                WC()->cart->session->persistent_cart_update();
            }
        }

        // تحديث النسخة المحفوظة في الجلسة أيضاً
        if ( WC()->session ) {
            if ( $dept === 'all' || ( WC()->cart && WC()->cart->is_empty() ) ) {
                WC()->session->__unset( 'paris_preserved_cart' );
                WC()->session->__unset( 'pwo_cart_guardian_backup' );
                WC()->session->__unset( 'paris_cart_selected_keys' );
                self::$cart_in_memory_backup = null;
            } else {
                $remaining_backup = WC()->cart->get_cart();
                WC()->session->set( 'paris_preserved_cart', $remaining_backup );
                WC()->session->set( 'pwo_cart_guardian_backup', $remaining_backup );
                self::$cart_in_memory_backup = $remaining_backup;
            }
        }

        self::$allow_cart_empty = false;

        wp_send_json_success();
    }

    public static function render( int $order_id ): void {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        self::ensure_cart_preserved();

        require_once dirname( __FILE__ ) . '/class-pwo-message.php';
        $analysis = PWO_Message::analyze_order_departments( $order );

        // ── 1. إذا كان الطلب مختلطاً (ملابس + أدوات منزلية) ──
        if ( $analysis['type'] === 'mixed' ) {
            self::render_split_order_screen( $order, $analysis );
            return;
        }

        // ── 2. إذا كان الطلب لقسم واحد (تحويل فوري) ──
        $wa_url = PWO_Message::get_whatsapp_url_for_dept( $order, $analysis['type'] );
        ?>
        <style>
        .woocommerce-order > .woocommerce-notice,
        .woocommerce-order > .woocommerce-order-overview,
        .woocommerce-order-overview,
        .woocommerce-thankyou-order-received,
        .woocommerce-order-details,
        .woocommerce-customer-details,
        ul.order_details {
            display: none !important;
        }
        </style>
        <div class="pwo-thankyou" dir="rtl" style="text-align:center;padding:3rem 1rem;font-family:'Cairo',sans-serif;">
            <div style="font-size:3rem;margin-bottom:1rem;animation:spin 1s linear infinite;">⏳</div>
            <h2 style="color:#133e29;margin-bottom:.5rem;">جاري تحويلك إلى واتساب لتأكيد الطلب...</h2>
            <p style="color:#666;margin-bottom:1.5rem;">
                رقم طلبك: <strong>#<?php echo esc_html( $order->get_order_number() ); ?></strong>
            </p>
            <a
                id="pwo-wa-btn"
                href="<?php echo esc_url( $wa_url ); ?>"
                onclick="pwoMarkSingleSent('<?php echo esc_url( $wa_url ); ?>')"
                style="
                    display:inline-flex;align-items:center;gap:.6rem;
                    background:#25D366;color:#fff;
                    padding:.9rem 2rem;border-radius:50px;
                    font-size:1.15rem;font-weight:700;text-decoration:none;
                    box-shadow:0 4px 15px rgba(37,211,102,.4);
                "
            >
                اضغط هنا لو لم يتم تحويلك تلقائياً
            </a>
        </div>

        <script>
        function pwoMarkSingleSent(url) {
            if (window.fetch) {
                var fd = new FormData();
                fd.append('action', 'pwo_confirm_department_sent');
                fd.append('dept', 'all');
                fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', { method: 'POST', body: fd, keepalive: true });
            }
        }
        (function () {
            var waUrl = <?php echo wp_json_encode( $wa_url ); ?>;
            pwoMarkSingleSent(waUrl);
            window.location.replace(waUrl);
        }());
        </script>
        <?php
    }

    /**
     * عرض شاشة تأكيد الطلب المقسمة للطلبات المختلطة
     */
    private static function render_split_order_screen( WC_Order $order, array $analysis ): void {
        $order_number = $order->get_order_number();
        $clothes_url  = PWO_Message::get_whatsapp_url_for_dept( $order, 'clothes' );
        $home_url     = PWO_Message::get_whatsapp_url_for_dept( $order, 'home' );

        $clothes_items = $analysis['clothes'];
        $home_items    = $analysis['home'];

        $clothes_subtotal = 0;
        foreach ( $clothes_items as $item ) {
            $clothes_subtotal += $item->get_total();
        }

        $home_subtotal = 0;
        foreach ( $home_items as $item ) {
            $home_subtotal += $item->get_total();
        }
        ?>
        <!-- إخفاء بلوك شكراً لك وجدول WooCommerce الافتراضي تماماً لكي لا يظن العميل أن الطلب انتهى -->
        <style>
        .woocommerce-order > .woocommerce-notice,
        .woocommerce-order > .woocommerce-order-overview,
        .woocommerce-order-overview,
        .woocommerce-thankyou-order-received,
        .woocommerce-order-details,
        .woocommerce-customer-details,
        ul.order_details {
            display: none !important;
        }
        </style>

        <div class="pwo-split-container" dir="rtl">
            <!-- الهيدر التنبيهي المباشر -->
            <div class="pwo-split-header pwo-alert-header">
                <div class="pwo-urgent-tag">⚠️ خطوة أخيرة ومهمة لتأكيد طلبك</div>
                <h2 class="pwo-urgent-title">طلبك لم يُرسل بعد! يجب تأكيده عبر واتساب 📱</h2>
                <p class="pwo-split-subtitle">
                    طلبك رقم <strong>#<?php echo esc_html( $order_number ); ?></strong> يضم منتجات من فرعين مستقلين (<strong>مول الملابس 👗</strong> و<strong>مول الأدوات المنزلية 🏠</strong>).<br>
                    <span class="pwo-callout-bold">⚠️ المحلات لا تبدأ في تجهيز الطلب إلا بعد إرساله عبر واتساب! اضغط على الزر الأخضر لكل قسم بالأسفل لإرسال طلبك فوراً:</span>
                </p>
            </div>

            <div class="pwo-split-cards">
                <!-- كارت 1: مول الملابس -->
                <div class="pwo-branch-card clothes-card" id="card-clothes">
                    <div class="pwo-branch-top">
                        <span class="pwo-branch-badge clothes">👗 فرع الملابس</span>
                        <span class="pwo-items-count"><?php echo count( $clothes_items ); ?> منتج</span>
                    </div>

                    <div class="pwo-items-list">
                        <?php foreach ( $clothes_items as $item ) :
                            $product = $item->get_product();
                            $img_url = $product ? get_the_post_thumbnail_url( $product->get_id(), 'thumbnail' ) : '';
                            if ( ! $img_url && $product ) {
                                $img_url = get_post_meta( $product->get_id(), '_paris_external_img', true );
                            }
                        ?>
                            <div class="pwo-item-row">
                                <?php if ( $img_url ) : ?>
                                    <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $item->get_name() ); ?>" class="pwo-item-thumb">
                                <?php endif; ?>
                                <div class="pwo-item-meta">
                                    <div class="pwo-item-name"><?php echo esc_html( $item->get_name() ); ?></div>
                                    <div class="pwo-item-qty">الكمية: <?php echo esc_html( $item->get_quantity() ); ?></div>
                                </div>
                                <div class="pwo-item-price"><?php echo wp_strip_all_tags( wc_price( $item->get_total() ) ); ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="pwo-branch-total">
                        <span>إجمالي قسم الملابس:</span>
                        <strong><?php echo wp_strip_all_tags( wc_price( $clothes_subtotal ) ); ?></strong>
                    </div>

                    <a
                        href="<?php echo esc_url( $clothes_url ); ?>"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="pwo-branch-btn clothes-btn"
                        id="btn-clothes"
                        onclick="pwoMarkSent(this, 'clothes')"
                    >
                        <span>📱 تأكيد طلب الملابس عبر واتساب ←</span>
                    </a>
                </div>

                <!-- كارت 2: مول الأدوات المنزلية -->
                <div class="pwo-branch-card home-card" id="card-home">
                    <div class="pwo-branch-top">
                        <span class="pwo-branch-badge home">🏠 فرع الأدوات المنزلية</span>
                        <span class="pwo-items-count"><?php echo count( $home_items ); ?> منتج</span>
                    </div>

                    <div class="pwo-items-list">
                        <?php foreach ( $home_items as $item ) :
                            $product = $item->get_product();
                            $img_url = $product ? get_the_post_thumbnail_url( $product->get_id(), 'thumbnail' ) : '';
                            if ( ! $img_url && $product ) {
                                $img_url = get_post_meta( $product->get_id(), '_paris_external_img', true );
                            }
                        ?>
                            <div class="pwo-item-row">
                                <?php if ( $img_url ) : ?>
                                    <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $item->get_name() ); ?>" class="pwo-item-thumb">
                                <?php endif; ?>
                                <div class="pwo-item-meta">
                                    <div class="pwo-item-name"><?php echo esc_html( $item->get_name() ); ?></div>
                                    <div class="pwo-item-qty">الكمية: <?php echo esc_html( $item->get_quantity() ); ?></div>
                                </div>
                                <div class="pwo-item-price"><?php echo wp_strip_all_tags( wc_price( $item->get_total() ) ); ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="pwo-branch-total">
                        <span>إجمالي قسم الأدوات:</span>
                        <strong><?php echo wp_strip_all_tags( wc_price( $home_subtotal ) ); ?></strong>
                    </div>

                    <a
                        href="<?php echo esc_url( $home_url ); ?>"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="pwo-branch-btn home-btn"
                        id="btn-home"
                        onclick="pwoMarkSent(this, 'home')"
                    >
                        <span>📱 تأكيد طلب الأدوات عبر واتساب ←</span>
                    </a>
                </div>
            </div>

            <div class="pwo-split-banner-done" id="pwo-all-done-banner" style="display:none;">
                <div class="pwo-done-icon">🎉</div>
                <h3 class="pwo-done-title">تم إرسال الطلب للفرعين بنجاح!</h3>
                <p class="pwo-done-desc">شكراً لك، سيتواصل معك مسؤولو الفروع على واتساب لمتابعة التوصيل بأقرب وقت.</p>
            </div>

            <div class="pwo-split-footer">
                <a href="<?php echo esc_url( wc_get_cart_url() ); ?>" class="pwo-back-cart-btn">
                    <span>✏️ لم ترسل بعد؟ العودة لتعديل السلة</span>
                </a>
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="pwo-back-home-btn">
                    <span>← العودة للرئيسية وتصفح المتجر</span>
                </a>
            </div>
        </div>

        <style>
        .pwo-split-container {
            max-width: 960px;
            margin: 20px auto 40px;
            padding: 0 16px;
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #222;
        }
        .pwo-split-header.pwo-alert-header {
            background: linear-gradient(135deg, #fff9f0 0%, #fff4e5 100%);
            border: 2px solid #f59e0b;
            border-radius: 18px;
            padding: 24px 20px;
            text-align: center;
            margin-bottom: 28px;
            box-shadow: 0 4px 18px rgba(245, 158, 11, 0.12);
        }
        .pwo-urgent-tag {
            display: inline-block;
            background: #f59e0b;
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 50px;
            margin-bottom: 10px;
            letter-spacing: 0.3px;
        }
        .pwo-urgent-title {
            font-size: 24px;
            font-weight: 800;
            color: #b45309;
            margin: 0 0 10px;
            line-height: 1.35;
        }
        .pwo-split-subtitle {
            font-size: 14.5px;
            color: #4b5563;
            margin: 0;
            line-height: 1.7;
        }
        .pwo-callout-bold {
            display: block;
            margin-top: 8px;
            font-weight: 800;
            color: #92400e;
        }
        .pwo-split-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }
        .pwo-branch-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 22px 20px;
            display: flex;
            flex-direction: column;
            border: 2px solid #eee;
            box-shadow: 0 4px 18px rgba(0,0,0,0.06);
            position: relative;
            transition: all 0.25s ease;
        }
        .pwo-branch-card.clothes-card {
            border-color: #cde4d6;
        }
        .pwo-branch-card.home-card {
            border-color: #f7e7c4;
        }
        .pwo-branch-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1.5px solid #f0eee9;
        }
        .pwo-branch-badge {
            font-size: 14.5px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 999px;
        }
        .pwo-branch-badge.clothes {
            background: #eaf3ed;
            color: #133e29;
        }
        .pwo-branch-badge.home {
            background: #fdf5e6;
            color: #b58117;
        }
        .pwo-items-count {
            font-size: 13px;
            color: #777;
            font-weight: 600;
        }
        .pwo-items-list {
            flex: 1;
            margin-bottom: 20px;
            max-height: 280px;
            overflow-y: auto;
            padding-left: 4px;
        }
        .pwo-item-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #f4f1ea;
        }
        .pwo-item-row:last-child {
            border-bottom: none;
        }
        .pwo-item-thumb {
            width: 48px;
            height: 48px;
            object-fit: cover;
            border-radius: 10px;
            border: 1px solid #eee;
            flex-shrink: 0;
        }
        .pwo-item-meta {
            flex: 1;
            min-width: 0;
        }
        .pwo-item-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #222;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .pwo-item-qty {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }
        .pwo-item-price {
            font-size: 14px;
            font-weight: 800;
            color: #133e29;
            flex-shrink: 0;
        }
        .pwo-branch-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            margin-bottom: 18px;
            border-top: 1.5px solid #ede8de;
            font-size: 14.5px;
            color: #444;
        }
        .pwo-branch-total strong {
            font-size: 17px;
            color: #133e29;
            font-weight: 800;
        }
        .pwo-branch-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 20px;
            border-radius: 50px;
            color: #ffffff !important;
            font-size: 14.5px;
            font-weight: 800;
            text-decoration: none !important;
            transition: all 0.25s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.12);
            cursor: pointer;
        }
        .pwo-branch-btn.clothes-btn {
            background: #25D366;
        }
        .pwo-branch-btn.clothes-btn:hover {
            background: #20ba59;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37,211,102,0.35);
        }
        .pwo-branch-btn.home-btn {
            background: #25D366;
        }
        .pwo-branch-btn.home-btn:hover {
            background: #20ba59;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37,211,102,0.35);
        }
        .pwo-branch-btn.is-sent {
            background: #133e29 !important;
            opacity: 0.88;
        }
        .pwo-split-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 14px;
            margin-top: 36px;
        }
        .pwo-back-cart-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 24px;
            background: #ffffff;
            border: 1.5px solid #133e29;
            border-radius: 50px;
            color: #133e29;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(19,62,41,0.06);
        }
        .pwo-back-cart-btn:hover {
            background: #133e29;
            color: #ffffff !important;
            transform: translateY(-1px);
        }
        .pwo-back-home-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 24px;
            background: #ffffff;
            border: 1.5px solid #dcd7ce;
            border-radius: 50px;
            color: #555;
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .pwo-back-home-btn:hover {
            background: #f4f8f5;
            border-color: #133e29;
            color: #133e29;
        }
        </style>

        <script>
        var pwoSentState = { clothes: false, home: false };

        function pwoMarkSent(btn, dept) {
            btn.classList.add('is-sent');
            btn.innerHTML = '<span>✓ تم إرسال طلب ' + (dept === 'clothes' ? 'الملابس' : 'الأدوات') + ' بنجاح</span>';
            pwoSentState[dept] = true;

            // إرسال تنبيه للسيرفر بحذف عناصر هذا الفرع من السلة فقط لأنها أُرسلت فعلياً للواتساب
            if (window.fetch) {
                var formData = new FormData();
                formData.append('action', 'pwo_confirm_department_sent');
                formData.append('dept', dept);
                fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
                    method: 'POST',
                    body: formData,
                    keepalive: true
                });
            }

            if (pwoSentState.clothes && pwoSentState.home) {
                var banner = document.getElementById('pwo-all-done-banner');
                if (banner) {
                    banner.style.display = 'block';
                    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
        </script>
        <?php
    }
}
