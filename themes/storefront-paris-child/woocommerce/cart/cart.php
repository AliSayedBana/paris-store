<?php
/**
 * Paris Store - Custom Cart Page with Amazon-style Selective Checkout
 * سلة تسوق مول باريس مع ميزة تحديد المنتجات للشراء (مثل أمازون)
 *
 * @version 11.2.0
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_before_cart' );

$cart_items    = WC()->cart->get_cart();
$total_items   = count( $cart_items );
$selected_keys = WC()->session ? WC()->session->get( 'paris_cart_selected_keys' ) : null;
if ( ! is_array( $selected_keys ) ) {
    $selected_keys = array_keys( $cart_items );
}

// حساب عدد العناصر المحددة
$selected_count = 0;
foreach ( array_keys( $cart_items ) as $k ) {
    if ( in_array( $k, $selected_keys, true ) ) {
        $selected_count++;
    }
}
$all_selected = ( $selected_count === $total_items && $total_items > 0 );
?>

<form class="woocommerce-cart-form" action="<?php echo esc_url( wc_get_cart_url() ); ?>" method="post">
	<?php do_action( 'woocommerce_before_cart_table' ); ?>

	<!-- شريط أمازون لتحديد المنتجات -->
	<div class="paris-cart-selection-bar" dir="rtl">
		<div class="paris-csb-right">
			<label class="paris-csb-checkbox-label">
				<input type="checkbox" id="paris-select-all-toggle" <?php checked( $all_selected, true ); ?>>
				<span class="paris-csb-checkbox-visual"></span>
				<span class="paris-csb-text">تحديد جميع المنتجات (<span class="paris-selected-count"><?php echo esc_html( $selected_count ); ?></span> من <?php echo esc_html( $total_items ); ?>)</span>
			</label>
		</div>
		<div class="paris-csb-actions">
			<button type="button" class="paris-csb-btn-action" id="paris-btn-toggle-all">
				<?php echo $all_selected ? 'إلغاء تحديد الكل' : 'تحديد الكل'; ?>
			</button>
		</div>
	</div>

	<table class="shop_table shop_table_responsive cart woocommerce-cart-form__contents" cellspacing="0">
		<thead>
			<tr>
				<th scope="col" class="product-select" style="width:44px;text-align:center;"><span class="screen-reader-text">تحديد</span></th>
				<th scope="col" class="product-remove"><span class="screen-reader-text"><?php esc_html_e( 'Remove item', 'woocommerce' ); ?></span></th>
				<th scope="col" class="product-thumbnail"><span class="screen-reader-text"><?php esc_html_e( 'Thumbnail image', 'woocommerce' ); ?></span></th>
				<th scope="col" class="product-name"><?php esc_html_e( 'Product', 'woocommerce' ); ?></th>
				<th scope="col" class="product-price"><?php esc_html_e( 'Price', 'woocommerce' ); ?></th>
				<th scope="col" class="product-quantity"><?php esc_html_e( 'Quantity', 'woocommerce' ); ?></th>
				<th scope="col" class="product-subtotal"><?php esc_html_e( 'Subtotal', 'woocommerce' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php do_action( 'woocommerce_before_cart_contents' ); ?>

			<?php
			foreach ( $cart_items as $cart_item_key => $cart_item ) {
				$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
				$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );
				$visible    = apply_filters( 'woocommerce_cart_item_visible', true, $cart_item, $cart_item_key );

				if ( $_product instanceof WC_Product && $_product->exists() && $cart_item['quantity'] > 0 && $visible ) {
					$cart_item_name    = WC()->cart->get_item_product_name( $cart_item, $_product );
					$product_name      = apply_filters( 'woocommerce_cart_item_name', $cart_item_name, $cart_item, $cart_item_key );
					$product_permalink = apply_filters( 'woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink( $cart_item ) : '', $cart_item, $cart_item_key );
					$is_item_selected  = in_array( $cart_item_key, $selected_keys, true );

					$row_classes = apply_filters( 'woocommerce_cart_item_class', 'cart_item', $cart_item, $cart_item_key );
					if ( ! $is_item_selected ) {
						$row_classes .= ' paris-item-unselected';
					}
					?>
					<tr class="woocommerce-cart-form__cart-item <?php echo esc_attr( $row_classes ); ?>" data-cart-key="<?php echo esc_attr( $cart_item_key ); ?>">

						<!-- عمود التحديد (Amazon style) -->
						<td class="product-select" style="text-align:center;vertical-align:middle;">
							<label class="paris-item-select-label" title="تحديد هذا المنتج للشراء الآن">
								<input type="checkbox"
								       class="paris-cart-item-checkbox"
								       data-cart-key="<?php echo esc_attr( $cart_item_key ); ?>"
								       data-line-total="<?php echo esc_attr( $cart_item['line_total'] ); ?>"
								       value="1"
								       <?php checked( $is_item_selected, true ); ?>>
								<span class="paris-item-select-visual"></span>
							</label>
						</td>

						<td class="product-remove">
							<?php
								echo apply_filters(
									'woocommerce_cart_item_remove_link',
									sprintf(
										'<a role="button" href="%s" class="remove" aria-label="%s" data-product_id="%s" data-product_sku="%s">&times;</a>',
										esc_url( wc_get_cart_remove_url( $cart_item_key ) ),
										esc_attr( sprintf( __( 'Remove %s from cart', 'woocommerce' ), wp_strip_all_tags( $product_name ) ) ),
										esc_attr( $product_id ),
										esc_attr( $_product->get_sku() )
									),
									$cart_item_key
								);
							?>
						</td>

						<td class="product-thumbnail">
						<?php
						$thumbnail = apply_filters( 'woocommerce_cart_item_thumbnail', $_product->get_image(), $cart_item, $cart_item_key );
						if ( ! $product_permalink ) {
							echo $thumbnail;
						} else {
							printf( '<a href="%s">%s</a>', esc_url( $product_permalink ), $thumbnail );
						}
						?>
						</td>

						<td role="rowheader" class="product-name" data-title="<?php esc_attr_e( 'Product', 'woocommerce' ); ?>">
						<?php
						if ( ! $product_permalink ) {
							echo wp_kses_post( $product_name . '&nbsp;' );
						} else {
							echo wp_kses_post( apply_filters( 'woocommerce_cart_item_name', sprintf( '<a href="%s">%s</a>', esc_url( $product_permalink ), $cart_item_name ), $cart_item, $cart_item_key ) );
						}

						do_action( 'woocommerce_after_cart_item_name', $cart_item, $cart_item_key );

						// علامة محفوظ للشراء لاحقاً
						?>
						<div class="paris-unselected-tag" style="<?php echo $is_item_selected ? 'display:none;' : ''; ?>">
							⏳ غير محدد للشراء الآن (محفوظ في السلة)
						</div>
						<?php

						echo wc_get_formatted_cart_item_data( $cart_item, false, $cart_item_name );

						if ( $_product->backorders_require_notification() && $_product->is_on_backorder( $cart_item['quantity'] ) ) {
							echo wp_kses_post( apply_filters( 'woocommerce_cart_item_backorder_notification', '<p class="backorder_notification">' . esc_html__( 'Available on backorder', 'woocommerce' ) . '</p>', $product_id ) );
						}
						?>
						</td>

						<td class="product-price" data-title="<?php esc_attr_e( 'Price', 'woocommerce' ); ?>">
							<?php
								echo apply_filters( 'woocommerce_cart_item_price', WC()->cart->get_product_price( $_product ), $cart_item, $cart_item_key );
							?>
						</td>

						<td class="product-quantity" data-title="<?php esc_attr_e( 'Quantity', 'woocommerce' ); ?>">
						<?php
						if ( $_product->is_sold_individually() ) {
							$min_quantity = 1;
							$max_quantity = 1;
						} else {
							$min_quantity = 0;
							$max_quantity = $_product->get_max_purchase_quantity();
						}

						$product_quantity = woocommerce_quantity_input(
							array(
								'input_name'   => "cart[{$cart_item_key}][qty]",
								'input_value'  => $cart_item['quantity'],
								'max_value'    => $max_quantity,
								'min_value'    => $min_quantity,
								'product_name' => $product_name,
							),
							$_product,
							false
						);

						echo apply_filters( 'woocommerce_cart_item_quantity', $product_quantity, $cart_item_key, $cart_item );
						?>
						</td>

						<td class="product-subtotal" data-title="<?php esc_attr_e( 'Subtotal', 'woocommerce' ); ?>">
							<?php
								echo apply_filters( 'woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ), $cart_item, $cart_item_key );
							?>
						</td>
					</tr>
					<?php
				}
			}
			?>

			<?php do_action( 'woocommerce_cart_contents' ); ?>

			<tr>
				<td colspan="7" class="actions">

					<?php if ( wc_coupons_enabled() ) { ?>
						<div class="coupon">
							<label for="coupon_code" class="screen-reader-text"><?php esc_html_e( 'Coupon:', 'woocommerce' ); ?></label> <input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="<?php esc_attr_e( 'Coupon code', 'woocommerce' ); ?>" /> <button type="submit" class="button<?php echo esc_attr( wc_wp_theme_get_element_class_name( 'button' ) ? ' ' . wc_wp_theme_get_element_class_name( 'button' ) : '' ); ?>" name="apply_coupon" value="<?php esc_attr_e( 'Apply coupon', 'woocommerce' ); ?>"><?php esc_html_e( 'Apply coupon', 'woocommerce' ); ?></button>
							<?php do_action( 'woocommerce_cart_coupon' ); ?>
						</div>
					<?php } ?>

					<button type="submit" class="button<?php echo esc_attr( wc_wp_theme_get_element_class_name( 'button' ) ? ' ' . wc_wp_theme_get_element_class_name( 'button' ) : '' ); ?>" name="update_cart" value="<?php esc_attr_e( 'Update cart', 'woocommerce' ); ?>"><?php esc_html_e( 'Update cart', 'woocommerce' ); ?></button>

					<?php do_action( 'woocommerce_cart_actions' ); ?>

					<?php wp_nonce_field( 'woocommerce-cart', 'woocommerce-cart-nonce' ); ?>
				</td>
			</tr>

			<?php do_action( 'woocommerce_after_cart_contents' ); ?>
		</tbody>
	</table>
	<?php do_action( 'woocommerce_after_cart_table' ); ?>
</form>

<?php do_action( 'woocommerce_before_cart_collaterals' ); ?>

<div class="cart-collaterals">
	<?php
		do_action( 'woocommerce_cart_collaterals' );
	?>
</div>

<?php do_action( 'woocommerce_after_cart' ); ?>
