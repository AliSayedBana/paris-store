/**
 * Paris Store - Side Cart & UI JavaScript v2.0
 */
(function($) {
    'use strict';

    const $overlay = $('.paris-cart-overlay');
    const $panel   = $('.paris-cart-panel');
    const $body    = $('body');

    function openCart() {
        $overlay.addClass('active');
        $panel.addClass('active');
        $body.css('overflow', 'hidden');
        loadCartContents();
    }

    function closeCart() {
        $overlay.removeClass('active');
        $panel.removeClass('active');
        $body.css('overflow', '');
    }

    function loadCartContents() {
        const $body_panel = $('.paris-cart-panel-body');
        $body_panel.html('<div class="paris-cart-loading" style="text-align:center;padding:40px;"><div class="paris-spinner"></div><p style="margin-top:10px;font-size:13px;color:#888;">جاري تحميل السلة...</p></div>');

        $.post(parisAjax.ajaxurl, {
            action: 'paris_get_cart',
            nonce: parisAjax.nonce
        }, function(response) {
            try {
                const data = (typeof response === 'object') ? response : JSON.parse(response);
                $body_panel.html(data.html);
                updateCartCount(data.count);
                $('.paris-cart-total-value').text(data.total);
            } catch(e) {
                console.error('Cart parse error:', e);
            }
        });
    }

    function updateCartCount(count) {
        $('.paris-cart-count').text(count);
        $('.cart-count-badge').text(count);
        if (count > 0) {
            $('.paris-cart-count').show();
        } else {
            $('.paris-cart-count').hide();
        }
    }

    // Open cart on header button click
    $(document).on('click', '.paris-open-cart', function(e) {
        e.preventDefault();
        openCart();
    });

    // Close on overlay or close button
    $(document).on('click', '.paris-cart-overlay, .paris-cart-close, .paris-cart-continue', closeCart);

    // Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') closeCart();
    });

    // Quantity controls and item removal inside side cart
    $(document).on('click', '.paris-qty-minus, .paris-qty-plus, .paris-cart-remove', function(e) {
        e.preventDefault();
        const $btn = $(this);
        const key  = $btn.data('key');
        let action_type = '';

        if ($btn.hasClass('paris-qty-minus')) action_type = 'minus';
        else if ($btn.hasClass('paris-qty-plus')) action_type = 'plus';
        else if ($btn.hasClass('paris-cart-remove')) action_type = 'remove';

        $btn.closest('.paris-cart-item').css('opacity', '0.5');

        $.post(parisAjax.ajaxurl, {
            action: 'paris_update_cart',
            action_type: action_type,
            key: key,
            nonce: parisAjax.nonce
        }, function(response) {
            try {
                const data = (typeof response === 'object') ? response : JSON.parse(response);
                $('.paris-cart-panel-body').html(data.html);
                updateCartCount(data.count);
                $('.paris-cart-total-value').text(data.total);
                $(document.body).trigger('wc_fragment_refresh');
            } catch(err) {
                console.error(err);
            }
        });
    });

    // Automatically slide open cart upon adding product
    $(document.body).on('added_to_cart', function(e, fragments, cart_hash, $button) {
        openCart();
    });

    // ============================================================
    // DUAL MALL TABS (Clothes vs Home)
    // ============================================================
    $(document).on('click', '.paris-mall-tab', function(e) {
        const $tab = $(this);
        const mall = $tab.data('mall');
        const url  = $tab.data('url');

        // If on homepage, switch subnav smoothly & filter products
        if ($('body').hasClass('home') || $('body').hasClass('paris-home-page')) {
            e.preventDefault();
            $('.paris-mall-tab').removeClass('active');
            $tab.addClass('active');

            if (mall === 'clothes') {
                $('#subnav-home').removeClass('active').hide();
                $('#subnav-clothes').addClass('active').fadeIn(200);
                // Filter products to clothes
                filterProductsByMall('clothes');
            } else {
                $('#subnav-clothes').removeClass('active').hide();
                $('#subnav-home').addClass('active').fadeIn(200);
                // Filter products to home
                filterProductsByMall('home');
            }
        } else {
            // If on internal page, navigate to mall category archive
            window.location.href = url;
        }
    });

    function filterProductsByMall(mall) {
        $('.paris-products-section ul.products li.product').each(function() {
            const cat = $(this).attr('data-category') || '';
            const cats = cat.split(' ');
            if (mall === 'clothes') {
                if (cats.indexOf('clothes') !== -1 || cats.indexOf('men') !== -1 || cats.indexOf('women') !== -1 || cats.indexOf('kids') !== -1) {
                    $(this).fadeIn(200);
                } else {
                    $(this).fadeOut(150);
                }
            } else {
                if (cats.indexOf('home') !== -1 || cats.indexOf('kitchen') !== -1 || cats.indexOf('decor') !== -1 || cats.indexOf('textiles') !== -1 || cats.indexOf('cleaning') !== -1 || cats.indexOf('organization') !== -1) {
                    $(this).fadeIn(200);
                } else {
                    $(this).fadeOut(150);
                }
            }
        });
    }

    // Instant Homepage Category Filter
    function applyPillFilter(filter) {
        if (!filter || filter === 'all') {
            $('.paris-products-section ul.products li.product').fadeIn(200);
        } else {
            $('.paris-products-section ul.products li.product').each(function() {
                const cat = $(this).attr('data-category') || '';
                const cats = cat.split(' ');
                if (cats.indexOf(filter) !== -1) {
                    $(this).fadeIn(200);
                } else {
                    $(this).fadeOut(150);
                }
            });
        }
    }

    $(document).on('click', '#paris-home-pills .paris-pill', function(e) {
        e.preventDefault();
        const $pill = $(this);
        const filter = $pill.data('filter');
        
        $('#paris-home-pills .paris-pill').removeClass('active');
        $pill.addClass('active');

        applyPillFilter(filter);
    });

    // Run active filter on load
    $(function() {
        const initialFilter = $('#paris-home-pills .paris-pill.active').data('filter');
        if (initialFilter && initialFilter !== 'all') {
            $('.paris-products-section ul.products li.product').each(function() {
                const cat = $(this).attr('data-category') || '';
                const cats = cat.split(' ');
                if (cats.indexOf(initialFilter) !== -1) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        }
    });

    // Wishlist Heart Toggle
    $(document).on('click', '.paris-heart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).toggleClass('favorited');
    });

})(jQuery);
