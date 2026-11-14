<?php
/**
 * صفحة الشكر — التحويل التلقائي لواتساب
 */
defined( 'ABSPATH' ) || exit;

class PWO_Thank_You {

    public static function init(): void {
        // استبدال محتوى صفحة الشكر للطلبات عبر واتساب
        add_action( 'woocommerce_thankyou_paris_whatsapp', [ __CLASS__, 'render' ], 1 );
        // تمرير بيانات الطلب للـ JS
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
    }

    public static function render( int $order_id ): void {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        $wa_url  = PWO_Message::get_whatsapp_url( $order );
        $options = get_option( 'woocommerce_paris_whatsapp_settings', [] );
        $delay   = absint( $options['redirect_delay'] ?? 2 );
        ?>
        <div class="pwo-thankyou" dir="rtl" style="text-align:center;padding:3rem 1rem;font-family:Cairo,sans-serif;">
            <div style="font-size:3rem;margin-bottom:1rem;animation:spin 1s linear infinite;">⏳</div>
            <h2 style="color:#133e29;margin-bottom:.5rem;">جاري تحويلك إلى واتساب لتأكيد الطلب...</h2>
            <p style="color:#666;margin-bottom:1.5rem;">
                رقم طلبك: <strong>#<?php echo esc_html( $order->get_order_number() ); ?></strong>
            </p>
            <a
                id="pwo-wa-btn"
                href="<?php echo esc_url( $wa_url ); ?>"
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
        (function () {
            var waUrl = <?php echo wp_json_encode( $wa_url ); ?>;
            window.location.replace(waUrl);
        }());
        </script>
        <?php
    }

    public static function enqueue_scripts(): void {
        // لا شيء إضافي مطلوب، الـ JS مضمّن في render()
    }
}

