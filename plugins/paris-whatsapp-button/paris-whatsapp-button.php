<?php
/**
 * Plugin Name: Paris WhatsApp Button
 * Plugin URI:  https://example.com
 * Description: زر واتساب عائم في كل الصفحات، وزر "اسأل عن المنتج" في صفحة كل منتج مع توجيه ذكي حسب القسم (ملابس / أدوات منزلية).
 * Version:     1.1.0
 * Author:      Paris Store
 * Text Domain: paris-wa-btn
 * Requires at least: 6.0
 * Requires PHP: 8.1
 */

defined( 'ABSPATH' ) || exit;

define( 'PWB_DIR', plugin_dir_path( __FILE__ ) );
define( 'PWB_URL', plugin_dir_url( __FILE__ ) );

// ── تحميل الأصول ─────────────────────────────────────────────────────────────
add_action( 'wp_enqueue_scripts', function (): void {
    wp_enqueue_style(
        'paris-wa-button',
        PWB_URL . 'assets/css/button.css',
        [],
        '1.1.0'
    );
} );

// ── صفحة الإعدادات في لوحة WordPress ────────────────────────────────────────
add_action( 'admin_menu', function (): void {
    add_options_page(
        'إعدادات زر واتساب',
        '📲 زر واتساب',
        'manage_options',
        'paris-wa-button',
        'pwb_settings_page'
    );
} );

add_action( 'admin_init', function (): void {
    register_setting( 'pwb_settings_group', 'pwb_options', [
        'sanitize_callback' => 'pwb_sanitize_options',
        'default'           => pwb_defaults(),
    ] );
} );

function pwb_defaults(): array {
    return [
        'whatsapp_number_clothes' => '201065968425',
        'whatsapp_number_home'    => '201065968425',
        'whatsapp_number'         => '201065968425',
        'floating_text'           => 'تواصل معنا',
        'product_text'            => 'اسأل عن المنتج 💬',
        'product_message_tpl'     => 'مرحباً، أريد الاستفسار عن المنتج: {product_name} ({product_url})',
        'floating_message'        => 'مرحباً، أريد الاستفسار 😊',
        'show_floating'           => '1',
        'show_product_btn'        => '1',
        'button_color'            => '#25D366',
        'position'                => 'bottom-right', // أو bottom-left
    ];
}

function pwb_sanitize_options( array $input ): array {
    $defaults = pwb_defaults();
    return [
        'whatsapp_number_clothes' => preg_replace( '/\D/', '', $input['whatsapp_number_clothes'] ?? $defaults['whatsapp_number_clothes'] ),
        'whatsapp_number_home'    => preg_replace( '/\D/', '', $input['whatsapp_number_home'] ?? $defaults['whatsapp_number_home'] ),
        'whatsapp_number'         => preg_replace( '/\D/', '', $input['whatsapp_number'] ?? $defaults['whatsapp_number'] ),
        'floating_text'           => sanitize_text_field( $input['floating_text'] ?? $defaults['floating_text'] ),
        'product_text'            => sanitize_text_field( $input['product_text'] ?? $defaults['product_text'] ),
        'product_message_tpl'     => sanitize_textarea_field( $input['product_message_tpl'] ?? $defaults['product_message_tpl'] ),
        'floating_message'        => sanitize_textarea_field( $input['floating_message'] ?? $defaults['floating_message'] ),
        'show_floating'           => ! empty( $input['show_floating'] ) ? '1' : '0',
        'show_product_btn'        => ! empty( $input['show_product_btn'] ) ? '1' : '0',
        'button_color'            => sanitize_hex_color( $input['button_color'] ?? $defaults['button_color'] ),
        'position'                => in_array( $input['position'] ?? '', [ 'bottom-right', 'bottom-left' ], true )
                                        ? $input['position']
                                        : 'bottom-right',
    ];
}

function pwb_settings_page(): void {
    $opts = get_option( 'pwb_options', pwb_defaults() );
    ?>
    <div class="wrap" dir="rtl">
        <h1>إعدادات زر واتساب — مول باريس</h1>
        <p style="color:#666;">يمكنك ضبط أرقام واتساب لكل فرع على حدة (فرع الملابس وفرع الأدوات المنزلية).</p>
        <form method="post" action="options.php">
            <?php settings_fields( 'pwb_settings_group' ); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="pwb_number_clothes">رقم واتساب فرع الملابس 👗</label></th>
                    <td>
                        <input type="text" id="pwb_number_clothes" name="pwb_options[whatsapp_number_clothes]"
                               value="<?php echo esc_attr( $opts['whatsapp_number_clothes'] ?? '201065968425' ); ?>" class="regular-text"
                               placeholder="201065968425">
                        <p class="description">يتم التحويل إليه عند الاستفسار عن أي منتج ملابس.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_number_home">رقم واتساب فرع الأدوات المنزلية 🏠</label></th>
                    <td>
                        <input type="text" id="pwb_number_home" name="pwb_options[whatsapp_number_home]"
                               value="<?php echo esc_attr( $opts['whatsapp_number_home'] ?? '201065968425' ); ?>" class="regular-text"
                               placeholder="201065968425">
                        <p class="description">يتم التحويل إليه عند الاستفسار عن أي منتج من قسم الأدوات المنزلية والديكور.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_number">الرقم العام الاحتياطي</label></th>
                    <td>
                        <input type="text" id="pwb_number" name="pwb_options[whatsapp_number]"
                               value="<?php echo esc_attr( $opts['whatsapp_number'] ); ?>" class="regular-text"
                               placeholder="201065968425">
                        <p class="description">بالصيغة الدولية بدون + مثال: 201065968425</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_float_text">نص الزر العائم</label></th>
                    <td><input type="text" id="pwb_float_text" name="pwb_options[floating_text]"
                               value="<?php echo esc_attr( $opts['floating_text'] ); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_float_msg">رسالة الزر العائم</label></th>
                    <td><textarea id="pwb_float_msg" name="pwb_options[floating_message]"
                                  rows="2" class="large-text"><?php echo esc_textarea( $opts['floating_message'] ); ?></textarea></td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_prod_text">نص زر المنتج</label></th>
                    <td><input type="text" id="pwb_prod_text" name="pwb_options[product_text]"
                               value="<?php echo esc_attr( $opts['product_text'] ); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_prod_msg">رسالة زر المنتج</label></th>
                    <td>
                        <textarea id="pwb_prod_msg" name="pwb_options[product_message_tpl]"
                                  rows="2" class="large-text"><?php echo esc_textarea( $opts['product_message_tpl'] ); ?></textarea>
                        <p class="description">المتغيرات المتاحة: <code>{product_name}</code>، <code>{product_url}</code></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">الموضع</th>
                    <td>
                        <select name="pwb_options[position]">
                            <option value="bottom-right" <?php selected( $opts['position'], 'bottom-right' ); ?>>يسار أسفل (RTL)</option>
                            <option value="bottom-left"  <?php selected( $opts['position'], 'bottom-left' ); ?>>يمين أسفل</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row">إظهار الزر العائم</th>
                    <td><input type="checkbox" name="pwb_options[show_floating]" value="1"
                               <?php checked( $opts['show_floating'], '1' ); ?>></td>
                </tr>
                <tr>
                    <th scope="row">إظهار زر المنتج</th>
                    <td><input type="checkbox" name="pwb_options[show_product_btn]" value="1"
                               <?php checked( $opts['show_product_btn'], '1' ); ?>></td>
                </tr>
                <tr>
                    <th scope="row"><label for="pwb_color">لون الزر</label></th>
                    <td><input type="color" id="pwb_color" name="pwb_options[button_color]"
                               value="<?php echo esc_attr( $opts['button_color'] ); ?>"></td>
                </tr>
            </table>
            <?php submit_button( 'حفظ الإعدادات' ); ?>
        </form>
    </div>
    <?php
}

// ── فحص قسم المنتج أو الصفحة ────────────────────────────────────────────────
function pwb_is_home_context( $product_id = 0 ): bool {
    if ( $product_id && class_exists( 'PWO_Message' ) ) {
        return PWO_Message::is_home_product( (int) $product_id );
    }

    $home_slugs = [ 'home', 'kitchen', 'decor', 'textiles', 'cleaning', 'organization', 'appliances', 'cookware' ];

    if ( $product_id ) {
        $terms = get_the_terms( $product_id, 'product_cat' );
        if ( $terms && ! is_wp_error( $terms ) ) {
            foreach ( $terms as $term ) {
                if ( in_array( $term->slug, $home_slugs, true ) ) {
                    return true;
                }
            }
        }
    } elseif ( is_product_category() ) {
        $current = get_queried_object();
        if ( $current && in_array( $current->slug, $home_slugs, true ) ) {
            return true;
        }
    }

    return false;
}

// ── الزر العائم (كل الصفحات) ─────────────────────────────────────────────────
add_action( 'wp_footer', function (): void {
    $opts = get_option( 'pwb_options', pwb_defaults() );
    if ( $opts['show_floating'] !== '1' ) {
        return;
    }

    // تحديد الرقم المناسب حسب الصفحة الحالية
    $is_home = false;
    if ( is_product() ) {
        global $product;
        $is_home = $product ? pwb_is_home_context( $product->get_id() ) : false;
    } elseif ( is_product_category() ) {
        $is_home = pwb_is_home_context();
    }

    if ( $is_home && ! empty( $opts['whatsapp_number_home'] ) ) {
        $number = esc_attr( $opts['whatsapp_number_home'] );
    } elseif ( ! empty( $opts['whatsapp_number_clothes'] ) ) {
        $number = esc_attr( $opts['whatsapp_number_clothes'] );
    } else {
        $number = esc_attr( $opts['whatsapp_number'] );
    }

    $text    = esc_html( $opts['floating_text'] );
    $message = rawurlencode( $opts['floating_message'] );
    $url     = "https://wa.me/{$number}?text={$message}";
    $color   = esc_attr( $opts['button_color'] );
    $pos_css = $opts['position'] === 'bottom-left' ? 'right:24px' : 'left:24px';
    ?>
    <a href="<?php echo esc_url( $url ); ?>"
       target="_blank"
       rel="noopener noreferrer"
       class="pwb-float"
       aria-label="تواصل معنا على واتساب"
       style="--pwb-color:<?php echo $color; ?>;<?php echo $pos_css; ?>">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span class="pwb-float__label"><?php echo $text; ?></span>
    </a>
    <?php
} );

// ── زر "اسأل عن المنتج" في صفحة المنتج ─────────────────────────────────────
add_action( 'woocommerce_after_add_to_cart_button', function (): void {
    $opts = get_option( 'pwb_options', pwb_defaults() );
    if ( empty( $opts['show_product_btn'] ) || ! is_product() ) {
        return;
    }

    global $product;
    $product_id = $product instanceof \WC_Product ? $product->get_id() : get_the_ID();
    $is_home    = pwb_is_home_context( $product_id );

    if ( $is_home && ! empty( $opts['whatsapp_number_home'] ) ) {
        $number = esc_attr( $opts['whatsapp_number_home'] );
    } elseif ( ! empty( $opts['whatsapp_number_clothes'] ) ) {
        $number = esc_attr( $opts['whatsapp_number_clothes'] );
    } else {
        $number = esc_attr( $opts['whatsapp_number'] );
    }

    $btn_text     = esc_html( $opts['product_text'] );
    $product_name = $product instanceof \WC_Product ? $product->get_name() : get_the_title();
    $product_url  = get_permalink( $product_id );

    $message_raw = str_replace(
        [ '{product_name}', '{product_url}' ],
        [ $product_name, $product_url ],
        $opts['product_message_tpl']
    );
    $message_enc = rawurlencode( $message_raw );
    $url         = "https://wa.me/{$number}?text={$message_enc}";
    $color       = esc_attr( $opts['button_color'] );
    ?>
    <a href="<?php echo esc_url( $url ); ?>"
       target="_blank"
       rel="noopener noreferrer"
       class="pwb-product-btn button"
       style="background:<?php echo $color; ?>;color:#fff;border-color:<?php echo $color; ?>;margin-top:.75rem;display:inline-flex;align-items:center;gap:.5rem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <?php echo $btn_text; ?>
    </a>
    <?php
} );
