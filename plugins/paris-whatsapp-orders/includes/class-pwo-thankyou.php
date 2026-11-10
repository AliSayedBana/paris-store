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
        <div class="pwo-thankyou" dir="rtl" style="text-align:center;padding:2rem 1rem;font-family:Cairo,sans-serif;">
            <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
            <h2 style="color:#128C7E;margin-bottom:.5rem;">تم تسجيل طلبك بنجاح!</h2>
            <p style="font-size:1.1rem;color:#333;margin-bottom:.5rem;">
                رقم طلبك: <strong>#<?php echo esc_html( $order->get_order_number() ); ?></strong>
            </p>
            <p style="color:#555;margin-bottom:2rem;">
                سيتم فتح واتساب الآن لإرسال تفاصيل طلبك لنا وإتمام التأكيد.
            </p>

            <?php if ( $delay > 0 ) : ?>
            <p class="pwo-countdown" style="font-size:.95rem;color:#777;margin-bottom:1.5rem;">
                سيتم التحويل خلال <span id="pwo-seconds"><?php echo esc_html( $delay ); ?></span> ثواني...
            </p>
            <?php endif; ?>

            <a
                id="pwo-wa-btn"
                href="<?php echo esc_url( $wa_url ); ?>"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    display:inline-flex;align-items:center;gap:.6rem;
                    background:#25D366;color:#fff;
                    padding:.9rem 2rem;border-radius:50px;
                    font-size:1.15rem;font-weight:700;text-decoration:none;
                    box-shadow:0 4px 15px rgba(37,211,102,.4);
                    transition:transform .2s,box-shadow .2s;
                "
                onmouseenter="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 20px rgba(37,211,102,.55)'"
                onmouseleave="this.style.transform='scale(1)';this.style.boxShadow='0 4px 15px rgba(37,211,102,.4)'"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                أرسل طلبك على واتساب الآن
            </a>

            <p style="margin-top:1.5rem;font-size:.85rem;color:#999;">
                لو لم يفتح واتساب تلقائياً، اضغط الزر أعلاه مباشرةً.
            </p>
        </div>

        <script>
        (function () {
            var delay   = <?php echo (int) $delay; ?>;
            var waUrl   = <?php echo wp_json_encode( $wa_url ); ?>;
            var counter = document.getElementById('pwo-seconds');

            if (delay <= 0) {
                window.open(waUrl, '_blank');
                return;
            }

            var remaining = delay;
            var timer = setInterval(function () {
                remaining--;
                if (counter) counter.textContent = remaining;
                if (remaining <= 0) {
                    clearInterval(timer);
                    window.open(waUrl, '_blank');
                }
            }, 1000);
        }());
        </script>
        <?php
    }

    public static function enqueue_scripts(): void {
        // لا شيء إضافي مطلوب، الـ JS مضمّن في render()
    }
}

