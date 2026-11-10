<?php
/**
 * Paris Store Auto Setup Engine
 * محرك التثبيت والتهيئة الشامل لمتجر باريس
 */

defined( 'ABSPATH' ) || exit;

class Paris_Auto_Setup {

    public static function run(): void {
        // حماية: لا يعمل إلا للمدير أو لمرة واحدة
        if ( ! current_user_can( 'manage_options' ) && ! is_admin() ) {
            return;
        }

        self::cleanup_old_content();
        self::setup_site_identity();
        $categories = self::setup_categories();
        self::create_demo_products( $categories );
        self::setup_main_menu( $categories );
        self::setup_homepage();

        update_option( 'paris_store_fully_setup', 'yes' );
    }

    /**
     * 1. تنظيف المحتوى القديم الغريب (منتجات وقوائم الأعشاب والشاي)
     */
    private static function cleanup_old_content(): void {
        // حذف كل المنتجات القديمة
        $existing_products = get_posts( [
            'post_type'      => [ 'product', 'product_variation' ],
            'posts_per_page' => -1,
            'post_status'    => 'any',
            'fields'         => 'ids',
        ] );
        foreach ( $existing_products as $prod_id ) {
            wp_delete_post( $prod_id, true );
        }

        // تنظيف تصنيفات المنتجات القديمة
        $old_terms = get_terms( [
            'taxonomy'   => 'product_cat',
            'hide_empty' => false,
        ] );
        if ( ! is_wp_error( $old_terms ) ) {
            foreach ( $old_terms as $term ) {
                if ( $term->slug !== 'uncategorized' ) {
                    wp_delete_term( $term->term_id, 'product_cat' );
                }
            }
        }

        // مسح القوائم القديمة
        $menus = wp_get_nav_menus();
        foreach ( $menus as $menu ) {
            wp_delete_nav_menu( $menu->term_id );
        }
    }

    /**
     * 2. ضبط هوية الموقع والعملة
     */
    private static function setup_site_identity(): void {
        update_option( 'blogname', 'متجر باريس | Paris Store' );
        update_option( 'blogdescription', 'أرقى الملابس العصرية وأحدث الأدوات المنزلية بتوصيل فوري لجميع المحافظات' );
        update_option( 'woocommerce_currency', 'EGP' );
        update_option( 'woocommerce_price_num_decimals', 0 );
        update_option( 'woocommerce_default_country', 'EG' );
    }

    /**
     * 3. إنشاء شجرة الأقسام الرسمية لمتجر باريس
     */
    private static function setup_categories(): array {
        $cats = [
            'clothes' => [
                'name'     => 'قسم الملابس',
                'children' => [
                    'men'   => 'ملابس رجالي',
                    'women' => 'ملابس حريمي',
                    'kids'  => 'ملابس أطفال',
                ],
            ],
            'home' => [
                'name'     => 'قسم الأدوات المنزلية',
                'children' => [
                    'kitchen'    => 'أدوات ومستلزمات مطبخ',
                    'appliances' => 'أجهزة كهربائية صغيرة',
                    'cookware'   => 'حلل وأطقم طهي',
                    'decor'      => 'منظمات وديكور منزلي',
                ],
            ],
        ];

        $cat_ids = [];

        foreach ( $cats as $key => $info ) {
            $parent_term = wp_insert_term( $info['name'], 'product_cat', [
                'slug' => $key,
            ] );

            $parent_id = is_wp_error( $parent_term ) ? (int) $parent_term->get_error_data() : $parent_term['term_id'];
            $cat_ids[ $key ] = $parent_id;

            foreach ( $info['children'] as $child_key => $child_name ) {
                $child_term = wp_insert_term( $child_name, 'product_cat', [
                    'slug'   => $child_key,
                    'parent' => $parent_id,
                ] );
                $child_id = is_wp_error( $child_term ) ? (int) $child_term->get_error_data() : $child_term['term_id'];
                $cat_ids[ $child_key ] = $child_id;
            }
        }

        return $cat_ids;
    }

    /**
     * 4. إنشاء منتجات متنوعة وجذابة مع صور وأسعار
     */
    private static function create_demo_products( array $cats ): void {
        $products_data = [
            // ── ملابس رجالي ──
            [
                'title'       => 'تيشيرت بولو قطن مصري فاخر',
                'sku'         => 'PARIS-MEN-01',
                'price'       => 280,
                'sale_price'  => 240,
                'cat'         => $cats['men'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'تيشيرت بولو خامة قطن 100% ناعمة ومريحة جداً للاستخدام اليومي والعمل، متوفر بألوان كلاسيكية متعددة.',
            ],
            [
                'title'       => 'قميص كتان كاجوال صيفي',
                'sku'         => 'PARIS-MEN-02',
                'price'       => 450,
                'sale_price'  => 380,
                'cat'         => $cats['men'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'قميص كتان طبيعي عالي الجودة بارد على الجسم وتفصيل عصري أنيق مناسب لجميع المناسبات.',
            ],
            [
                'title'       => 'بنطلون جبردين سليم فيت',
                'sku'         => 'PARIS-MEN-03',
                'price'       => 420,
                'sale_price'  => 350,
                'cat'         => $cats['men'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'بنطلون جبردين قطني مريح جداً بخامة مطاطية خفيفة وقصة سليم فيت تناسب الخروجات الرسمية والكاجوال.',
            ],

            // ── ملابس حريمي ──
            [
                'title'       => 'فستان حرير ماكسي راقي بأكمام',
                'sku'         => 'PARIS-WOMEN-01',
                'price'       => 650,
                'sale_price'  => 520,
                'cat'         => $cats['women'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'فستان حريمي أنيق بخامة حريرية ناعمة وقصة فضفاضة وجذابة للمناسبات والزيارات.',
            ],
            [
                'title'       => 'عباية كاجوال خليجي مطرزة',
                'sku'         => 'PARIS-WOMEN-02',
                'price'       => 580,
                'sale_price'  => 490,
                'cat'         => $cats['women'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'عباية سوداء خليجية بتطريز كمبيوتر خفيف على الأكمام، قماش كريب ملكي لا ينكمش.',
            ],

            // ── ملابس أطفال ──
            [
                'title'       => 'طقم خروج ولادي قطعتين (تيشيرت + شورت)',
                'sku'         => 'PARIS-KIDS-01',
                'price'       => 320,
                'sale_price'  => 260,
                'cat'         => $cats['kids'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'طقم أطفال مريح وعصري مصنوع من القطن الصافي المناسب لبشرة الأطفال الحساسة.',
            ],

            // ── أدوات ومستلزمات مطبخ ──
            [
                'title'       => 'طقم سكاكين مطبخ ستانلس ياباني 6 قطع مع حامل',
                'sku'         => 'PARIS-HOME-01',
                'price'       => 390,
                'sale_price'  => 310,
                'cat'         => $cats['kitchen'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'طقم سكاكين حاد جداً ومقاوم للصدأ مع مقص مطبخ ومسن وحامل أنيق يزين سطح المطبخ.',
            ],
            [
                'title'       => 'طقم توابل دوار زجاجي 12 برطمان ستانلس',
                'sku'         => 'PARIS-HOME-02',
                'price'       => 280,
                'sale_price'  => 220,
                'cat'         => $cats['kitchen'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'حامل توابل دوار 360 درجة مع زجاجات محكمة الغلق لحفظ النكهة وتنظيم مطبخك بسهولة.',
            ],

            // ── أجهزة كهربائية صغيرة ──
            [
                'title'       => 'غلاية مياه كهربائية بيركس إضاءة LED سعة 2 لتر',
                'sku'         => 'PARIS-APP-01',
                'price'       => 450,
                'sale_price'  => 370,
                'cat'         => $cats['appliances'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'غلاية زجاجية صحية مقاومة للحرارة العالية مع فصل أوتوماتيكي وإضاءة زرقاء أنيقة أثناء الغليان.',
            ],
            [
                'title'       => 'مفرمة لحم وخضار كبة كهربائية ستانلس 3 لتر 500 وات',
                'sku'         => 'PARIS-APP-02',
                'price'       => 550,
                'sale_price'  => 460,
                'cat'         => $cats['appliances'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'كبة 4 شفرات قوية لفرم اللحوم وتقطيع الملوخية والخضروات في ثوانٍ معدودة بهيكل فولاذي قوي.',
            ],

            // ── حلل وأطقم طهي ──
            [
                'title'       => 'طقم حلل جرانيت كوري تركي أصلي 10 قطع',
                'sku'         => 'PARIS-COOK-01',
                'price'       => 2800,
                'sale_price'  => 2350,
                'cat'         => $cats['cookware'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1584990347449-397262145b5e?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'طقم جرانيت متكامل (4 حلل بمقاسات مختلفة + مقلاة + صينية فرن)، طبقة غير لاصقة سهلة التنظيف.',
            ],

            // ── منظمات وديكور منزلي ──
            [
                'title'       => 'طقم منظمات أدراج ومكتب أكليريك شفاف 5 قطع',
                'sku'         => 'PARIS-DEC-01',
                'price'       => 190,
                'sale_price'  => 150,
                'cat'         => $cats['decor'] ?? 0,
                'type'        => 'simple',
                'image'       => 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
                'desc'        => 'منظمات متعددة الاستخدامات لتنسيق المكياج والإكسسوارات وأدراج الملابس بدقة وشياكة.',
            ],
        ];

        foreach ( $products_data as $data ) {
            $product = new WC_Product_Simple();
            $product->set_name( $data['title'] );
            $product->set_sku( $data['sku'] );
            $product->set_regular_price( $data['price'] );
            $product->set_sale_price( $data['sale_price'] );
            $product->set_description( $data['desc'] );
            $product->set_short_description( $data['desc'] );
            $product->set_status( 'publish' );
            $product->set_stock_status( 'instock' );
            $product->set_manage_stock( true );
            $product->set_stock_quantity( 50 );

            if ( ! empty( $data['cat'] ) ) {
                $product->set_category_ids( [ $data['cat'] ] );
            }

            // تحميل الصورة وربطها بالمنتج
            $attach_id = self::upload_image_from_url( $data['image'], $data['title'] );
            if ( $attach_id ) {
                $product->set_image_id( $attach_id );
            }

            $product->save();
        }
    }

    /**
     * 5. إنشاء قائمة الموقع العلوية المنظمة والمربوطة بالأقسام
     */
    private static function setup_main_menu( array $cats ): void {
        $menu_name     = 'القائمة الرئيسية لمتجر باريس';
        $menu_location = 'primary-menu';

        $menu_id = wp_create_nav_menu( $menu_name );
        if ( is_wp_error( $menu_id ) ) {
            return;
        }

        // الصفحة الرئيسية
        wp_update_nav_menu_item( $menu_id, 0, [
            'menu-item-title'  => 'الرئيسية',
            'menu-item-url'    => home_url( '/' ),
            'menu-item-status' => 'publish',
        ] );

        // المتجر العام
        $shop_page_id = wc_get_page_id( 'shop' );
        wp_update_nav_menu_item( $menu_id, 0, [
            'menu-item-title'     => 'جميع المنتجات',
            'menu-item-object'    => 'page',
            'menu-item-object-id' => $shop_page_id,
            'menu-item-type'      => 'post_type',
            'menu-item-status'    => 'publish',
        ] );

        // 1. رابط رئيسي: قسم الملابس
        $clothes_term = get_term( $cats['clothes'], 'product_cat' );
        $clothes_item_id = wp_update_nav_menu_item( $menu_id, 0, [
            'menu-item-title'     => '👕 قسم الملابس',
            'menu-item-object'    => 'product_cat',
            'menu-item-object-id' => $cats['clothes'],
            'menu-item-type'      => 'taxonomy',
            'menu-item-status'    => 'publish',
        ] );

        // الفروع تحت الملابس:
        $sub_clothes = [
            'men'   => 'ملابس رجالي',
            'women' => 'ملابس حريمي',
            'kids'  => 'ملابس أطفال',
        ];
        foreach ( $sub_clothes as $k => $label ) {
            if ( ! empty( $cats[ $k ] ) ) {
                wp_update_nav_menu_item( $menu_id, 0, [
                    'menu-item-title'     => $label,
                    'menu-item-object'    => 'product_cat',
                    'menu-item-object-id' => $cats[ $k ],
                    'menu-item-type'      => 'taxonomy',
                    'menu-item-status'    => 'publish',
                    'menu-item-parent-id' => $clothes_item_id,
                ] );
            }
        }

        // 2. رابط رئيسي: قسم الأدوات المنزلية
        $home_item_id = wp_update_nav_menu_item( $menu_id, 0, [
            'menu-item-title'     => '🏠 الأدوات المنزلية',
            'menu-item-object'    => 'product_cat',
            'menu-item-object-id' => $cats['home'],
            'menu-item-type'      => 'taxonomy',
            'menu-item-status'    => 'publish',
        ] );

        // الفروع تحت الأدوات:
        $sub_home = [
            'kitchen'    => 'أدوات مطبخ',
            'appliances' => 'أجهزة كهربائية',
            'cookware'   => 'حلل وأطقم طهي',
            'decor'      => 'منظمات وديكور',
        ];
        foreach ( $sub_home as $k => $label ) {
            if ( ! empty( $cats[ $k ] ) ) {
                wp_update_nav_menu_item( $menu_id, 0, [
                    'menu-item-title'     => $label,
                    'menu-item-object'    => 'product_cat',
                    'menu-item-object-id' => $cats[ $k ],
                    'menu-item-type'      => 'taxonomy',
                    'menu-item-status'    => 'publish',
                    'menu-item-parent-id' => $home_item_id,
                ] );
            }
        }

        // تعيين القائمة كمكان رئيسي في القالب
        $locations = get_theme_mod( 'nav_menu_locations' );
        $locations['primary'] = $menu_id;
        $locations['primary-menu'] = $menu_id;
        set_theme_mod( 'nav_menu_locations', $locations );
    }

    /**
     * 6. بناء وتنسيق صفحة رئيسية فخمة بالكامل
     */
    private static function setup_homepage(): void {
        $page_title = 'الرئيسية';
        $existing_page = get_page_by_title( $page_title );

        $hero_html = '
        <div style="background: linear-gradient(135deg, #1b2838 0%, #0d1b2a 100%); color: #fff; padding: 70px 20px; border-radius: 16px; text-align: center; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <span style="background: #e63946; color: #fff; padding: 6px 16px; border-radius: 50px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 15px;">عروض الموسم في مول باريس 🔥</span>
            <h1 style="font-size: 2.8rem; margin: 0 0 15px; color: #fff; font-family: Cairo, sans-serif;">متجر باريس — وجهتك للأناقة والبيت العصري</h1>
            <p style="font-size: 1.25rem; max-width: 750px; margin: 0 auto 30px; color: #e0e1dd; line-height: 1.6;">تشكيلة حصرية تجمع بين أرقى الملابس وأحدث الأدوات المنزلية والأجهزة الكهربائية. اختر منتجاتك وادفع عند الاستلام عبر واتساب!</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="' . wc_get_page_permalink( 'shop' ) . '" style="background: #25D366; color: #fff; padding: 14px 35px; border-radius: 50px; font-size: 18px; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(37,211,102,0.4);">
                    تسوّق الآن عبر واتساب 📲
                </a>
            </div>
        </div>

        <div style="margin-bottom: 50px;">
            <h2 style="text-align: center; font-size: 2rem; margin-bottom: 30px; font-family: Cairo, sans-serif; position: relative;">
                🛍️ تصفح حسب القسم
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; text-align: center; transition: transform 0.2s;">
                    <span style="font-size: 40px;">👕</span>
                    <h3 style="margin: 10px 0;">قسم الملابس</h3>
                    <p style="color: #6c757d; font-size: 14px;">أحدث صيحات الموضة للرجال والنساء والأطفال بخامات قطنية ممتازة.</p>
                    <a href="' . wc_get_page_permalink( 'shop' ) . '?filter_cat=clothes" style="color: #1b2838; font-weight: bold; text-decoration: underline;">مشاهدة الملابس ➔</a>
                </div>
                <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; text-align: center;">
                    <span style="font-size: 40px;">🏠</span>
                    <h3 style="margin: 10px 0;">قسم الأدوات المنزلية</h3>
                    <p style="color: #6c757d; font-size: 14px;">أجهزة مطبخ، أطقم حلل، مستلزمات تنظيم عصرية تليق ببيتك.</p>
                    <a href="' . wc_get_page_permalink( 'shop' ) . '?filter_cat=home" style="color: #1b2838; font-weight: bold; text-decoration: underline;">مشاهدة الأدوات المنزلية ➔</a>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 50px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <h2 style="margin: 0; font-family: Cairo, sans-serif;">🌟 أحدث المنتجات المتوفرة</h2>
                <a href="' . wc_get_page_permalink( 'shop' ) . '" style="color: #0d1b2a; font-weight: bold; text-decoration: none;">عرض الكل ⬅️</a>
            </div>
            [products limit="8" columns="4" orderby="date" order="DESC"]
        </div>

        <div style="background: #f1faee; border: 1px dashed #457b9d; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 40px;">
            <h3 style="color: #1d3557; margin-top: 0;">🚚 توصيل سريع لجميع محافظات مصر والدفع عند الاستلام</h3>
            <p style="color: #457b9d; margin: 0; font-size: 16px;">اطلب أي منتج وسيصلك للمنزل بدون أي دفع أونلاين مسبق.. يتم تأكيد كل التفاصيل معك على الواتساب أولاً.</p>
        </div>
        ';

        $page_data = [
            'post_title'   => $page_title,
            'post_content' => $hero_html,
            'post_status'  => 'publish',
            'post_type'    => 'page',
        ];

        if ( $existing_page ) {
            $page_data['ID'] = $existing_page->ID;
            wp_update_post( $page_data );
            $page_id = $existing_page->ID;
        } else {
            $page_id = wp_insert_post( $page_data );
        }

        // تعيينها كصفحة رئيسية
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $page_id );
    }

    /**
     * مساعد: تحميل صورة وربطها بمكتبة وسائط ووردبريس
     */
    private static function upload_image_from_url( string $image_url, string $title ): int {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url( $image_url );
        if ( is_wp_error( $tmp ) ) {
            return 0;
        }

        $file_array = [
            'name'     => sanitize_title( $title ) . '.jpg',
            'tmp_name' => $tmp,
        ];

        $attach_id = media_handle_sideload( $file_array, 0 );
        if ( is_wp_error( $attach_id ) ) {
            @unlink( $file_array['tmp_name'] );
            return 0;
        }

        return $attach_id;
    }
}

