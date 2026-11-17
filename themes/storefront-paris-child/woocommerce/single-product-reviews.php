<?php
/**
 * Display single product reviews (comments) - Paris Store Custom Template
 *
 * @version 11.2.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! comments_open() ) {
	return;
}

$count = $product->get_review_count();
?>
<div id="reviews" class="woocommerce-Reviews paris-reviews-container" dir="rtl">
	<div id="comments" class="paris-comments-area">
		<h2 class="woocommerce-Reviews-title paris-reviews-main-title">
			<span>آراء وتقييمات العملاء</span>
			<?php if ( $count > 0 ) : ?>
				<span class="paris-reviews-count-badge"><?php echo esc_html( $count ); ?> مراجعة</span>
			<?php endif; ?>
		</h2>

		<?php if ( have_comments() ) : ?>
			<ol class="commentlist paris-comment-list">
				<?php wp_list_comments( apply_filters( 'woocommerce_product_review_list_args', array( 'callback' => 'woocommerce_comments' ) ) ); ?>
			</ol>

			<?php
			if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) :
				echo '<nav class="woocommerce-pagination paris-reviews-pagination">';
				paginate_comments_links(
					apply_filters(
						'woocommerce_comment_pagination_args',
						array(
							'prev_text' => '&rarr;',
							'next_text' => '&larr;',
							'type'      => 'list',
						)
					)
				);
				echo '</nav>';
			endif;
			?>
		<?php else : ?>
			<!-- كارت التقييمات الفارغة المصمم بشكل احترافي وجذاب -->
			<div class="paris-empty-reviews-card">
				<div class="paris-erc-icon-badge">
					<span>⭐</span>
				</div>
				<h3 class="paris-erc-heading">لا توجد مراجعات لهذا المنتج حتى الآن</h3>
				<p class="paris-erc-subtext">
					رأيك يهمنا ويسعدنا جداً! كن أول من يشارك تجربته مع هذا المنتج ويساعد العملاء الآخرين في اختيارهم.
				</p>
				<a href="#respond" class="paris-erc-action-btn" onclick="document.getElementById('respond').scrollIntoView({behavior:'smooth'}); return false;">
					<span>✍️ شاركنا برأيك واكتب أول تقييم</span>
				</a>
			</div>
		<?php endif; ?>
	</div>

	<?php if ( get_option( 'woocommerce_review_rating_verification_required' ) === 'no' || wc_customer_bought_product( '', get_current_user_id(), $product->get_id() ) ) : ?>
		<div id="review_form_wrapper" class="paris-review-form-wrapper">
			<div id="review_form">
				<?php
				$commenter    = wp_get_current_commenter();
				$comment_form = array(
					'title_reply'         => have_comments() ? 'أضف مراجعتك للمنتج' : 'أضف أول تقييم لمنتج ' . get_the_title(),
					'title_reply_to'      => 'الرد على %s',
					'title_reply_before'  => '<h3 id="reply-title" class="comment-reply-title paris-reply-title">',
					'title_reply_after'   => '</h3>',
					'comment_notes_after' => '',
					'label_submit'        => 'نشر التقييم الآن ←',
					'logged_in_as'        => '',
					'comment_field'       => '',
				);

				$name_email_required = (bool) get_option( 'require_name_email', 1 );
				$fields              = array(
					'author' => array(
						'label'        => 'الاسم بالكامل',
						'type'         => 'text',
						'value'        => $commenter['comment_author'],
						'required'     => $name_email_required,
						'autocomplete' => 'name',
						'placeholder'  => 'اكتب اسمك هنا...',
					),
					'email'  => array(
						'label'        => 'البريد الإلكتروني',
						'type'         => 'email',
						'value'        => $commenter['comment_author_email'],
						'required'     => $name_email_required,
						'autocomplete' => 'email',
						'placeholder'  => 'بريدك الإلكتروني (لن يتم نشره)',
					),
				);

				$comment_form['fields'] = array();

				foreach ( $fields as $key => $field ) {
					$field_html  = '<p class="comment-form-' . esc_attr( $key ) . ' paris-form-group">';
					$field_html .= '<label for="' . esc_attr( $key ) . '">' . esc_html( $field['label'] );

					if ( $field['required'] ) {
						$field_html .= '&nbsp;<span class="required">*</span>';
					}

					$field_html .= '</label><input id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" type="' . esc_attr( $field['type'] ) . '" value="' . esc_attr( $field['value'] ) . '" size="30" ' . ( $field['required'] ? 'required' : '' ) . ' placeholder="' . esc_attr( $field['placeholder'] ) . '" autocomplete="' . esc_attr( $field['autocomplete'] ) . '" /></p>';

					$comment_form['fields'][ $key ] = $field_html;
				}

				$account_page_url = wc_get_page_permalink( 'myaccount' );
				if ( $account_page_url ) {
					/* translators: %s opening and closing link tags respectively */
					$comment_form['must_log_in'] = '<p class="must-log-in">' . sprintf( esc_html__( 'You must be %1$slogged in%2$s to post a review.', 'woocommerce' ), '<a href="' . esc_url( $account_page_url ) . '">', '</a>' ) . '</p>';
				}

				if ( wc_review_ratings_enabled() ) {
					$comment_form['comment_field'] = '<div class="comment-form-rating paris-rating-picker"><label for="rating">' . esc_html__( 'Your rating', 'woocommerce' ) . ( wc_review_ratings_required() ? '&nbsp;<span class="required">*</span>' : '' ) . '</label><select name="rating" id="rating" required>
						<option value="">' . esc_html__( 'Rate&hellip;', 'woocommerce' ) . '</option>
						<option value="5">ممتاز - 5 نجوم</option>
						<option value="4">جيد جداً - 4 نجوم</option>
						<option value="3">متوسط - 3 نجوم</option>
						<option value="2">مقبول - نجمتان</option>
						<option value="1">ضعيف - نجمة واحدة</option>
					</select></div>';
				}

				$comment_form['comment_field'] .= '<p class="comment-form-comment paris-form-group"><label for="comment">مراجعتك وتجربتك بالتفصيل&nbsp;<span class="required">*</span></label><textarea id="comment" name="comment" cols="45" rows="5" required placeholder="اكتب تفاصيل تجربتك مع المنتج، جودته، وسرعة التوصيل..."></textarea></p>';

				comment_form( apply_filters( 'woocommerce_product_review_comment_form_args', $comment_form ) );
				?>
			</div>
		</div>
	<?php else : ?>
		<p class="woocommerce-verification-required"><?php esc_html_e( 'Only logged in customers who have purchased this product may leave a review.', 'woocommerce' ); ?></p>
	<?php endif; ?>

	<div class="clear"></div>
</div>
