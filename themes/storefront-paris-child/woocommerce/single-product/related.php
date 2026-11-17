<?php
/**
 * Related Products - Paris Store Custom Template
 *
 * @version 10.3.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( $related_products ) :
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
			<?php foreach ( $related_products as $related_product ) : ?>
				<?php
				$post_object = get_post( $related_product->get_id() );
				setup_postdata( $GLOBALS['post'] = $post_object );
				wc_get_template_part( 'content', 'product' );
				?>
			<?php endforeach; ?>
		</ul>
	</section>
	<?php
endif;

wp_reset_postdata();
