<?php
/**
 * The template for displaying product content within loops
 * Paris Store - Modern Custom Product Card matching exact UI design
 */

defined('ABSPATH') || exit;

global $product;

if (empty($product) || !$product->is_visible()) {
    return;
}

$id       = $product->get_id();
$title    = $product->get_name();
$link     = $product->get_permalink();
$in_stock = $product->is_in_stock();

// Image resolution: priority 1: attachment, priority 2: _paris_external_img, priority 3: placeholder
$img = get_the_post_thumbnail_url($id, 'woocommerce_thumbnail');
if (!$img) {
    $img = get_post_meta($id, '_paris_external_img', true);
}
if (!$img) {
    $img = wc_placeholder_img_src('woocommerce_thumbnail');
}

// Categories & Labels
$terms = get_the_terms($id, 'product_cat');
$cat_name = get_post_meta($id, '_paris_cat_name', true);
$parent_label = get_post_meta($id, '_paris_parent_label', true);
$cat_slugs = [];

if ($terms && !is_wp_error($terms)) {
    foreach ($terms as $t) {
        if ($t->slug !== 'uncategorized') {
            $cat_slugs[] = $t->slug;
            if (empty($cat_name) && !in_array($t->slug, ['clothes', 'home'])) {
                $cat_name = $t->name;
            }
            if (empty($parent_label)) {
                if (in_array($t->slug, ['clothes', 'men', 'women', 'kids'])) {
                    $parent_label = 'قسم الملابس';
                } elseif (in_array($t->slug, ['home', 'kitchen', 'decor', 'textiles', 'cleaning', 'organization'])) {
                    $parent_label = 'قسم الأدوات المنزلية';
                }
            }
        }
    }
}
if (empty($parent_label)) {
    $parent_label = 'قسم المنتجات';
}
if (empty($cat_name) && !empty($terms[0])) {
    $cat_name = $terms[0]->name;
}
$cat_slug_str = implode(' ', $cat_slugs);

// Badges: Discount % & New
$discount_tag = get_post_meta($id, '_paris_discount_tag', true);
$is_new = get_post_meta($id, '_paris_is_new', true);

if (empty($discount_tag) && $product->is_on_sale()) {
    $reg = (float)$product->get_regular_price();
    $sal = (float)$product->get_sale_price();
    if ($reg > 0 && $sal > 0 && $reg > $sal) {
        $pct = round((($reg - $sal) / $reg) * 100);
        $discount_tag = 'خصم ' . $pct . '%';
    }
}
if ($is_new === '') {
    $is_new = 'yes';
}
?>

<li <?php wc_product_class('paris-modern-card', $product); ?> data-category="<?php echo esc_attr($cat_slug_str); ?>">

  <!-- Card Top Bar: Badges Right, Parent Center, Heart Left -->
  <div class="paris-card-top-bar">
    <div class="card-badges-group">
      <?php if (!empty($discount_tag)) : ?>
        <span class="badge-discount"><?php echo esc_html($discount_tag); ?></span>
      <?php endif; ?>
      <?php if ($is_new === 'yes') : ?>
        <span class="badge-new">جديد</span>
      <?php endif; ?>
    </div>

    <div class="card-parent-label">
      <span><?php echo esc_html($parent_label); ?></span>
    </div>

    <button type="button" class="paris-heart" aria-label="أضف للمفضلة" title="أضف للمفضلة">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  </div>

  <!-- Product Image -->
  <a href="<?php echo esc_url($link); ?>" class="paris-product-img-wrap">
    <img src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr($title); ?>" loading="lazy">
  </a>

  <!-- Card Body (Centered) -->
  <div class="paris-card-body centered">
    <?php if ($cat_name) : ?>
      <span class="paris-cat-label"><?php echo esc_html($cat_name); ?></span>
    <?php endif; ?>

    <h3 class="paris-card-title">
      <a href="<?php echo esc_url($link); ?>"><?php echo esc_html($title); ?></a>
    </h3>

    <div class="paris-card-price-wrap">
      <?php if ($product->is_on_sale()) : ?>
        <span class="price-sale"><?php echo wc_price($product->get_sale_price()); ?></span>
        <span class="price-regular"><del><?php echo wc_price($product->get_regular_price()); ?></del></span>
      <?php else : ?>
        <span class="price-normal"><?php echo wc_price($product->get_price()); ?></span>
      <?php endif; ?>
    </div>

    <?php if ($in_stock) : ?>
      <a href="?add-to-cart=<?php echo $id; ?>" data-product_id="<?php echo $id; ?>" class="paris-btn-add-cart button add_to_cart_button ajax_add_to_cart">
        <span>إضافة إلى السلة</span>
      </a>
    <?php else : ?>
      <span class="paris-btn-out-stock">نفد من المخزون</span>
    <?php endif; ?>
  </div>

</li>

