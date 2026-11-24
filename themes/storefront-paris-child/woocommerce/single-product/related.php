<?php
/**
 * Related Products - Paris Store Custom Template
 * Supports prioritized smart Upsells (custom recommendations) + same sub-category fallback
 *
 * @version 10.3.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;
if ( ! $product && get_the_ID() ) {
    $product = wc_get_product( get_the_ID() );
}

// 1. Check if admin specified custom Upsell products (الترقيات والترشيحات الذكية المخصصة يدوياً)
$curated_ids = [];
if ( $product ) {
    $upsell_ids = $product->get_upsell_ids();
    if ( ! empty( $upsell_ids ) ) {
        $curated_ids = $upsell_ids;
    }
}

// 2. If no custom upsells, find products from the exact same specific sub-category first (ترشيحات منطقية من نفس التخصص)
if ( empty( $curated_ids ) && $product ) {
    $current_id = $product->get_id();
    $terms = get_the_terms( $current_id, 'product_cat' );
    $subcat_ids = [];
    if ( $terms && ! is_wp_error( $terms ) ) {
        foreach ( $terms as $term ) {
            // Pick specific subcategories (e.g. kitchen, decor, men, women, kids) and exclude generic parents
            if ( ! in_array( $term->slug, [ 'clothes', 'home', 'uncategorized' ], true ) ) {
                $subcat_ids[] = (int) $term->term_id;
            }
        }
    }
    
    if ( ! empty( $subcat_ids ) ) {
        $subcat_query = new WP_Query([
            'post_type'           => 'product',
            'post_status'         => 'publish',
            'posts_per_page'      => 4,
            'post__not_in'        => [ $current_id ],
            'tax_query'           => [[
                'taxonomy'         => 'product_cat',
                'field'            => 'term_id',
                'terms'            => $subcat_ids,
                'include_children' => false,
            ]],
            'fields'              => 'ids',
            'orderby'             => 'rand',
        ]);
        if ( ! empty( $subcat_query->posts ) ) {
            $curated_ids = $subcat_query->posts;
        }
    }
}

// 3. Fallback to default related products if still empty
if ( empty( $curated_ids ) && ! empty( $related_products ) ) {
    foreach ( $related_products as $rel_item ) {
        $curated_ids[] = is_object( $rel_item ) ? $rel_item->get_id() : (int) $rel_item;
    }
}

// Limit to 4 items (2x2 grid)
$curated_ids = array_slice( array_unique( $curated_ids ), 0, 4 );

if ( ! empty( $curated_ids ) ) :
	if ( function_exists( 'wp_increase_content_media_count' ) ) {
		$content_media_count = wp_increase_content_media_count( 0 );
		if ( $content_media_count < wp_omit_loading_attr_threshold() ) {
			wp_increase_content_media_count( wp_omit_loading_attr_threshold() - $content_media_count );
		}
	}
	?>

	<section class="paris-related-section related products" dir="rtl">
		<div class="paris-related-header">
			<div class="paris-related-title-wrap">
				<span class="paris-related-badge">تشكيلة مميزة</span>
				<h2 class="paris-related-title">منتجات ذات صلة</h2>
				<p class="paris-related-subtitle">منتجات مختارة من نفس القسم قد تعجبك أيضاً وتناسب احتياجك</p>
			</div>
		</div>

		<ul class="paris-related-grid products">
			<?php foreach ( $curated_ids as $p_id ) : ?>
				<?php
				$post_object = get_post( $p_id );
				if ( ! $post_object || $post_object->post_status !== 'publish' ) {
					continue;
				}
				setup_postdata( $GLOBALS['post'] = $post_object );
				wc_get_template_part( 'content', 'product' );
				?>
			<?php endforeach; ?>
		</ul>
	</section>
	<?php
endif;

wp_reset_postdata();
