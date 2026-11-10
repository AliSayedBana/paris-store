<?php
/**
 * Paris Store Identity, Styling & Corporate Pages
 * ملف الهوية والتصميم الشامل والصفحات المؤسسية لمتجر باريس
 */

defined( 'ABSPATH' ) || exit;

class Paris_Design_Upgrade {

    public static function init(): void {
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_styles_and_fonts' ] );
        add_action( 'wp_footer', [ __CLASS__, 'render_mobile_bottom_bar' ] );
        add_action( 'admin_init', [ __CLASS__, 'create_corporate_pages_once' ] );
    }

    /**
     * 1. تحميل خط Cairo وتصميم CSS الاحترافي الشامل
     */
    public static function enqueue_styles_and_fonts(): void {
        // تحميل خط Cairo من Google Fonts
        wp_enqueue_style( 'paris-cairo-font', 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap', [], null );

        $custom_css = '
        :root {
            --paris-primary: #0f172a;       /* كحلي ملكي فخم */
            --paris-accent: #d97706;        /* ذهبي دافئ للعروض والأسعار */
            --paris-green: #25D366;         /* أخضر واتساب */
            --paris-bg-light: #f8fafc;
            --paris-card-border: #e2e8f0;
        }

        body, h1, h2, h3, h4, h5, h6, p, a, input, select, textarea, button, .woocommerce {
            font-family: "Cairo", sans-serif !important;
        }

        /* ── تجميل كروت المنتجات ── */
        ul.products li.product {
            background: #ffffff !important;
            border: 1px solid var(--paris-card-border) !important;
            border-radius: 12px !important;
            padding: 16px !important;
            transition: all 0.25s ease-in-out !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
            text-align: center !important;
            overflow: hidden !important;
        }

        ul.products li.product:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08) !important;
            border-color: #cbd5e1 !important;
        }

        ul.products li.product img {
            border-radius: 8px !important;
            margin-bottom: 12px !important;
            object-fit: cover !important;
            aspect-ratio: 1 / 1 !important;
        }

        ul.products li.product .woocommerce-loop-product__title {
            font-size: 1.05rem !important;
            font-weight: 700 !important;
            color: var(--paris-primary) !important;
            margin-bottom: 8px !important;
            height: 48px !important;
            overflow: hidden !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
        }

        ul.products li.product .price {
            font-size: 1.2rem !important;
            font-weight: 800 !important;
            color: var(--paris-accent) !important;
            margin-bottom: 14px !important;
        }

        ul.products li.product .price del {
            color: #94a3b8 !important;
            font-weight: 400 !important;
            font-size: 0.95rem !important;
            margin-left: 6px !important;
        }

        ul.products li.product .button {
            background-color: var(--paris-primary) !important;
            color: #ffffff !important;
            border-radius: 50px !important;
            padding: 10px 20px !important;
            font-weight: 700 !important;
            font-size: 0.9rem !important;
            width: 100% !important;
            transition: background 0.2s ease !important;
        }

        ul.products li.product .button:hover {
            background-color: var(--paris-accent) !important;
            color: #ffffff !important;
        }

        /* ── شارات الخصومات ── */
        .woocommerce span.onsale {
            background-color: #ef4444 !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            border-radius: 50px !important;
            padding: 4px 12px !important;
            font-size: 0.8rem !important;
            min-height: auto !important;
            line-height: 1.5 !important;
            top: 12px !important;
            right: 12px !important;
            left: auto !important;
        }

        /* ── شريط ملاحة الموبايل السفلي الشبيه بالتطبيقات ── */
        .paris-mobile-bar {
            display: none;
        }

        @media (max-width: 768px) {
            .paris-mobile-bar {
                display: flex;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #ffffff;
                box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
                border-top: 1px solid #e2e8f0;
                z-index: 9998;
                justify-content: space-around;
                padding: 8px 0;
            }

            .paris-mobile-bar a {
                color: #64748b;
                text-decoration: none;
                text-align: center;
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            }

            .paris-mobile-bar a.active,
            .paris-mobile-bar a:hover {
                color: var(--paris-primary);
            }

            .paris-mobile-bar a svg {
                width: 22px;
                height: 22px;
            }

            /* مسافة أسفل الصفحة لكي لا يغطي الشريط المحتوى */
            body {
                padding-bottom: 60px !important;
            }
        }
        ';

        wp_add_inline_style( 'woocommerce-general', $custom_css );
    }

    /**
     * 2. رسم شريط التنقل السفلي للموبايل
     */
    public static function render_mobile_bottom_bar(): void {
        $home_url = home_url( '/' );
        $shop_url = wc_get_page_permalink( 'shop' );
        $cart_url = wc_get_cart_url();
        $cart_count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
        ?>
        <div class="paris-mobile-bar" dir="rtl">
            <a href="<?php echo esc_url( $home_url ); ?>">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span>الرئيسية</span>
            </a>
            <a href="<?php echo esc_url( $shop_url ); ?>">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                <span>المنتجات</span>
            </a>
            <a href="<?php echo esc_url( $cart_url ); ?>" style="position:relative;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span>السلة</span>
                <?php if ( $cart_count > 0 ) : ?>
                    <span style="position:absolute;top:-4px;right:15px;background:#ef4444;color:#fff;border-radius:50%;font-size:10px;padding:1px 5px;font-weight:bold;"><?php echo $cart_count; ?></span>
                <?php endif; ?>
            </a>
            <a href="https://wa.me/201065968425" target="_blank" rel="noopener noreferrer" style="color:#25D366;">
                <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>واتساب</span>
            </a>
        </div>
        <?php
    }

    /**
     * 3. إنشاء الصفحات المؤسسية تلقائياً
     */
    public static function create_corporate_pages_once(): void {
        if ( get_option( 'paris_corporate_pages_created' ) ) {
            return;
        }

        $pages = [
            'من نحن' => '
                <div style="line-height:1.8; font-size:1.1rem; color:#334155;">
                    <h2>أهلاً بكم في متجر باريس (Paris Store)</h2>
                    <p>نحن وجهتكم الأولى والمتكاملة للتسوق العصري، حيث نجمع لك تحت سقف واحد أرقى تشكيلات <strong>الملابس العصرية</strong> للأسرة كاملة (رجالي، حريمي، أطفال) جنباً إلى جنب مع أحدث <strong>الأدوات المنزلية والأجهزة الكهربائية</strong> التي تلبي احتياجات كل بيت.</p>
                    <p>فلسفتنا في متجر باريس تقوم على توفير أعلى جودة من الخامات مع أسعار تنافسية تناسب الجميع، مع تسهيل تجربة الشراء من خلال التوصيل السريع والدفع عند الاستلام بعد المعاينة، وتأكيد كل طلب معك عبر الواتساب فوراً.</p>
                </div>
            ',
            'الشحن والتوصيل' => '
                <div style="line-height:1.8; font-size:1.1rem; color:#334155;">
                    <h2>سياسة الشحن والتوصيل</h2>
                    <p>نقوم بالشحن إلى <strong>جميع محافظات جمهورية مصر العربية</strong> عبر شركات شحن معتمدة وموثوقة.</p>
                    <ul>
                        <li><strong>مدة التوصيل:</strong> من يومين إلى 4 أيام عمل حسب محافظتك.</li>
                        <li><strong>تأكيد الطلب:</strong> بمجرد إتمام الطلب على الموقع، يتواصل معك فريق العمل عبر واتساب لتأكيد تفاصيل العنوان والمقاسات وموعد وصول المندوب.</li>
                        <li><strong>طريقة الدفع:</strong> الدفع عند الاستلام نقداً بعد استلام الشحنة، أو التحويل المباشر عبر فودافون كاش حسب رغبتك.</li>
                    </ul>
                </div>
            ',
            'سياسة الاستبدال والاسترجاع' => '
                <div style="line-height:1.8; font-size:1.1rem; color:#334155;">
                    <h2>الاستبدال والاسترجاع بكل سهولة</h2>
                    <p>ثقتكم هي غايتنا الأولى، لذلك نتيح لك حق معاينة واستبدال المنتجات وفق الشروط التالية:</p>
                    <ul>
                        <li>يحق للعميل معاينة المنتجات عند استلامها من المندوب.</li>
                        <li>إمكانية استبدال المقاسات خلال 14 يوماً من الاستلام بشرط بقاء المنتج في حالته الأصلية وبغلافه.</li>
                        <li>في حال وجود أي عيب مصنعي في الأدوات المنزلية أو الأجهزة، يتم الاستبدال فوراً وبدون أي تكلفة شحن إضافية.</li>
                    </ul>
                </div>
            ',
            'تواصل معنا والدعم' => '
                <div style="line-height:1.8; font-size:1.1rem; color:#334155;">
                    <h2>تواصل مع خدمة عملاء متجر باريس</h2>
                    <p>يسعدنا دائماً استقبال استفساراتكم وطلباتكم طوال أيام الأسبوع:</p>
                    <ul>
                        <li>📱 <strong>واتساب المبيعات والدعم:</strong> <a href="https://wa.me/201065968425" target="_blank" style="color:#25D366; font-weight:bold;">01065968425</a></li>
                        <li>🕒 <strong>ساعات العمل:</strong> يومياً من الساعة 10:00 صباحاً حتى 11:00 مساءً.</li>
                        <li>📍 <strong>المقر:</strong> جمهورية مصر العربية.</li>
                    </ul>
                </div>
            ',
        ];

        foreach ( $pages as $title => $content ) {
            if ( ! get_page_by_title( $title ) ) {
                wp_insert_post( [
                    'post_title'   => $title,
                    'post_content' => $content,
                    'post_status'  => 'publish',
                    'post_type'    => 'page',
                ] );
            }
        }

        update_option( 'paris_corporate_pages_created', 'yes' );
    }
}

Paris_Design_Upgrade::init();

