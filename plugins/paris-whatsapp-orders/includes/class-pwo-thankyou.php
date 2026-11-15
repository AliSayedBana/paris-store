<?php
/**
 * صفحة الشكر — التحويل التلقائي للطلبات الفردية أو العرض المقسم للطلبات المختلطة
 */
defined( 'ABSPATH' ) || exit;

class PWO_Thank_You {

    public static function init(): void {
        add_action( 'woocommerce_thankyou_paris_whatsapp', [ __CLASS__, 'render' ], 1 );
    }

    public static function render( int $order_id ): void {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        require_once dirname( __FILE__ ) . '/class-pwo-message.php';
        $analysis = PWO_Message::analyze_order_departments( $order );

        // ── 1. إذا كان الطلب مختلطاً (ملابس + أدوات منزلية) ──
        if ( $analysis['type'] === 'mixed' ) {
            self::render_split_order_screen( $order, $analysis );
            return;
        }

        // ── 2. إذا كان الطلب لقسم واحد (تحويل فوري احتياطي) ──
        $wa_url = PWO_Message::get_whatsapp_url_for_dept( $order, $analysis['type'] );
        ?>
        <div class="pwo-thankyou" dir="rtl" style="text-align:center;padding:3rem 1rem;font-family:'Cairo',sans-serif;">
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
        <div class="pwo-split-container" dir="rtl">
            <div class="pwo-split-header">
                <div class="pwo-success-icon">🎉</div>
                <h2>تم تسجيل طلبك بنجاح! رقم الطلب #<?php echo esc_html( $order_number ); ?></h2>
                <p class="pwo-split-subtitle">
                    نظراً لأن متجر <strong>مول باريس</strong> يضم فرعين مستقلين للتجهيز والشحن، تم تقسيم فاتورتك لتصل لكل فرع مباشرة على رقمه الخاص.<br>
                    <strong>يُرجى الضغط على الزرّين أدناه لإرسال تفاصيل كل قسم لفرعه المخصص:</strong>
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
                                    <div class="pwo-item-qty">الكمية: <strong><?php echo esc_html( $item->get_quantity() ); ?></strong></div>
                                </div>
                                <div class="pwo-item-price"><?php echo wc_price( $item->get_total() ); ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="pwo-branch-total">
                        <span>مجموع منتجات الملابس:</span>
                        <strong><?php echo wc_price( $clothes_subtotal ); ?></strong>
                    </div>

                    <a href="<?php echo esc_url( $clothes_url ); ?>" target="_blank" rel="noopener noreferrer" class="pwo-branch-btn clothes-btn" onclick="pwoMarkSent(this, 'clothes')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span>إرسال طلب الملابس لواتساب المحل 👗</span>
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
                                    <div class="pwo-item-qty">الكمية: <strong><?php echo esc_html( $item->get_quantity() ); ?></strong></div>
                                </div>
                                <div class="pwo-item-price"><?php echo wc_price( $item->get_total() ); ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="pwo-branch-total">
                        <span>مجموع منتجات الأدوات:</span>
                        <strong><?php echo wc_price( $home_subtotal ); ?></strong>
                    </div>

                    <a href="<?php echo esc_url( $home_url ); ?>" target="_blank" rel="noopener noreferrer" class="pwo-branch-btn home-btn" onclick="pwoMarkSent(this, 'home')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span>إرسال طلب الأدوات لواتساب المحل 🏠</span>
                    </a>
                </div>
            </div>

            <!-- رسالة الإتمام الكلي عند إرسال الاثنين -->
            <div id="pwo-all-done-banner" style="display:none;background:#eaf5ee;border:1.5px solid #133e29;border-radius:14px;padding:16px 20px;text-align:center;margin:25px auto;max-width:600px;color:#133e29;font-weight:700;font-size:15px;">
                🎉 ممتاز! تم إرسال تفاصيل الطلب بنجاح لكلا الفرعين. سيقوم فريق خدمة العملاء بالتواصل معك وتأكيد الشحن فوراً.
            </div>

            <div class="pwo-split-footer">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="pwo-back-home-btn">
                    <span>← العودة للرئيسية وتصفح المتجر</span>
                </a>
            </div>
        </div>

        <style>
        .pwo-split-container {
            max-width: 900px;
            margin: 30px auto 60px;
            padding: 0 15px;
            font-family: 'Cairo', Arial, sans-serif;
            text-align: right;
            direction: rtl;
        }
        .pwo-split-header {
            background: #ffffff;
            border: 1.5px solid #ede8de;
            border-radius: 20px;
            padding: 30px 24px;
            text-align: center;
            box-shadow: 0 4px 18px rgba(19,62,41,0.05);
            margin-bottom: 30px;
        }
        .pwo-success-icon {
            font-size: 44px;
            margin-bottom: 10px;
        }
        .pwo-split-header h2 {
            font-size: 24px;
            font-weight: 800;
            color: #133e29;
            margin-bottom: 12px;
        }
        .pwo-split-subtitle {
            font-size: 15px;
            color: #555e58;
            line-height: 1.7;
            max-width: 720px;
            margin: 0 auto;
        }
        .pwo-split-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 720px) {
            .pwo-split-cards {
                grid-template-columns: 1fr;
            }
        }
        .pwo-branch-card {
            background: #ffffff;
            border: 1.5px solid #ede8de;
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
            display: flex;
            flex-direction: column;
        }
        .pwo-branch-card.clothes-card {
            border-top: 4px solid #133e29;
        }
        .pwo-branch-card.home-card {
            border-top: 4px solid #eb6b47;
        }
        .pwo-branch-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #ede8de;
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
            background: #fdf1ed;
            color: #eb6b47;
        }
        .pwo-items-count {
            font-size: 12.5px;
            color: #79837d;
            font-weight: 700;
        }
        .pwo-items-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
            flex-grow: 1;
        }
        .pwo-item-row {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #fbf9f5;
            padding: 10px;
            border-radius: 12px;
            border: 1px solid #f0eae0;
        }
        .pwo-item-thumb {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid #e8e3d8;
        }
        .pwo-item-meta {
            flex-grow: 1;
            line-height: 1.35;
        }
        .pwo-item-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #1b231e;
        }
        .pwo-item-qty {
            font-size: 12px;
            color: #66726b;
            margin-top: 2px;
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
            border-top: 1px solid #eee8dc;
            margin-bottom: 16px;
            font-size: 14.5px;
            font-weight: 700;
            color: #333;
        }
        .pwo-branch-total strong {
            font-size: 18px;
            color: #133e29;
        }
        .pwo-branch-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            height: 48px;
            border-radius: 12px;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none !important;
            box-shadow: 0 4px 14px rgba(37,211,102,0.25);
            transition: all 0.25s ease;
        }
        .pwo-branch-btn.clothes-btn {
            background: #25D366;
        }
        .pwo-branch-btn.home-btn {
            background: #25D366;
        }
        .pwo-branch-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(37,211,102,0.35);
        }
        .pwo-branch-btn.sent {
            background: #133e29 !important;
            box-shadow: none !important;
        }
        .pwo-split-footer {
            text-align: center;
            margin-top: 30px;
        }
        .pwo-back-home-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 24px;
            border-radius: 999px;
            background: #ffffff;
            border: 1.5px solid #133e29;
            color: #133e29;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .pwo-back-home-btn:hover {
            background: #133e29;
            color: #ffffff;
        }
        </style>

        <script>
        var pwoSentBranches = { clothes: false, home: false };
        function pwoMarkSent(btn, branch) {
            pwoSentBranches[branch] = true;
            btn.classList.add('sent');
            btn.innerHTML = '<span>✓ تم إرسال طلب ' + (branch === 'clothes' ? 'الملابس' : 'الأدوات') + '</span>';
            if (pwoSentBranches.clothes && pwoSentBranches.home) {
                var banner = document.getElementById('pwo-all-done-banner');
                if (banner) {
                    banner.style.display = 'block';
                }
            }
        }
        </script>
        <?php
    }
}
