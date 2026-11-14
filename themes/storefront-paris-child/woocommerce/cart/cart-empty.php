<?php
/**
 * Paris Store - Empty cart page template
 *
 * @package storefront-paris-child
 * @version 7.0.1
 */

defined( 'ABSPATH' ) || exit;
?>

<div class="paris-empty-cart-container" dir="rtl">
    <div class="paris-empty-cart-card">
        <div class="paris-empty-cart-icon-wrapper">
            <span class="paris-empty-cart-icon">🛒</span>
        </div>
        
        <h2 class="paris-empty-cart-title">سلة مشترياتك فارغة حالياً</h2>
        
        <p class="paris-empty-cart-desc">
            لم تقم بإضافة أي منتجات إلى سلتك بعد.<br>
            تصفح أقسام متجرنا المتنوعة واكتشف أفضل العروض والخصومات الحصرية!
        </p>

        <div class="paris-empty-cart-actions">
            <a href="<?php echo esc_url( home_url( '/?mall=clothes' ) ); ?>" class="paris-btn-mall-clothes">
                <span>👗</span>
                <span>تسوق مول الملابس</span>
            </a>
            
            <a href="<?php echo esc_url( home_url( '/?mall=home' ) ); ?>" class="paris-btn-mall-home">
                <span>🏠</span>
                <span>تسوق مول الأدوات المنزلية</span>
            </a>

            <a href="<?php echo esc_url( apply_filters( 'woocommerce_return_to_shop_redirect', wc_get_page_permalink( 'shop' ) ) ); ?>" class="paris-btn-all-products">
                <span>🛍️</span>
                <span>كل المنتجات والعروض</span>
            </a>
        </div>
    </div>
</div>
