    <?php
/**
 * =====================================================================
 * Paris Store — استيراد مناطق الشحن لكل محافظات مصر
 * =====================================================================
 * طريقة الاستخدام:
 *   1. افتح ملف functions.php لقالبك الابن أو "Code Snippets".
 *   2. انسخ هذا الكود والصقه.
 *   3. اذهب لأي صفحة في الموقع لتشغيله مرة واحدة.
 *   4. احذفه فوراً بعد التشغيل (تشغيله أكثر من مرة لن يضر لكن غير ضروري).
 *
 * الأسعار مؤقتة — عدّلها من:
 *   WooCommerce > الإعدادات > الشحن > اسم المنطقة > تعديل
 * =====================================================================
 */

add_action( 'init', function () {

    // ── تغيير false إلى true لتشغيل الاستيراد ──────────────────────────
    $run_import = false;
    // ─────────────────────────────────────────────────────────────────────

    if ( ! $run_import || ! function_exists( 'wc_get_shipping_zone_by_id' ) ) {
        return;
    }

    /**
     * [اسم المنطقة => [محافظات => سعر الشحن]]
     * الأسعار بالجنيه المصري — أسعار مؤقتة قابلة للتعديل
     */
    $zones_data = [
        'القاهرة الكبرى' => [
            'states' => [ 'C', 'GZ' ], // Cairo, Giza
            'cost'   => 45,
        ],
        'الإسكندرية والمحروسة' => [
            'states' => [ 'ALX', 'MNF' ], // Alexandria, Menoufia
            'cost'   => 55,
        ],
        'وجه بحري (الدلتا)' => [
            'states' => [ 'DK', 'SHR', 'GH', 'KFS', 'BH', 'DT' ], // Dakahlia, Sharqia, Gharbia, Kafr El-Sheikh, Beheira, Damietta
            'cost'   => 60,
        ],
        'قناة السويس' => [
            'states' => [ 'IS', 'SUZ', 'PTS' ], // Ismailia, Suez, Port Said
            'cost'   => 65,
        ],
        'وجه قبلي (شمال)' => [
            'states' => [ 'FYM', 'BNS', 'MN' ], // Fayoum, Beni Suef, Minya
            'cost'   => 70,
        ],
        'وجه قبلي (جنوب)' => [
            'states' => [ 'AST', 'SHG', 'QN', 'LX', 'ASN' ], // Asyut, Sohag, Qena, Luxor, Aswan
            'cost'   => 80,
        ],
        'المحافظات الحدودية والساحل' => [
            'states' => [ 'MT', 'RD', 'WAD', 'NS', 'SS' ], // Matrouh, Red Sea, New Valley, N.Sinai, S.Sinai
            'cost'   => 95,
        ],
    ];

    foreach ( $zones_data as $zone_name => $data ) {
        $zone = new WC_Shipping_Zone();
        $zone->set_zone_name( $zone_name );

        foreach ( $data['states'] as $state_code ) {
            $zone->add_location( 'EG:' . $state_code, 'state' );
        }

        $zone->save();

        // إضافة طريقة شحن ثابتة
        $instance_id = $zone->add_shipping_method( 'flat_rate' );
        $option_key  = 'woocommerce_flat_rate_' . $instance_id . '_settings';
        update_option( $option_key, [
            'title'   => 'شحن لـ' . $zone_name,
            'cost'    => (string) $data['cost'],
            'enabled' => 'yes',
        ] );
    }

    // منطقة "كل مكان تاني" — احتياطي
    $fallback = new WC_Shipping_Zone( 0 ); // Zone ID 0 = Rest of World
    $fallback_id = $fallback->add_shipping_method( 'flat_rate' );
    update_option( 'woocommerce_flat_rate_' . $fallback_id . '_settings', [
        'title'   => 'شحن لباقي المحافظات',
        'cost'    => '100',
        'enabled' => 'yes',
    ] );

    error_log( '[Paris Store] ✅ تم استيراد مناطق الشحن بنجاح.' );
} );

