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
    // DUAL MALL TABS (Clothes vs Home) & BROWSER HISTORY SUPPORT
    // ============================================================
    function switchToMall(mall, pushHistory) {
        if (!mall) mall = 'clothes';

        $('.paris-mall-tab').removeClass('active');
        $('.paris-mall-tab[data-mall="' + mall + '"]').addClass('active');

        if (mall === 'clothes') {
            $('#subnav-home').removeClass('active').hide();
            $('#subnav-clothes').addClass('active').fadeIn(200);

            // Set 'كل الملابس' as active link in subnav
            $('#subnav-clothes .subnav-link').removeClass('active');
            $('#subnav-clothes .subnav-link').first().addClass('active');

            $('#paris-section-title-home').hide();
            $('#paris-section-title-clothes').fadeIn(200);

            filterProductsByMall('clothes');
        } else if (mall === 'home') {
            $('#subnav-clothes').removeClass('active').hide();
            $('#subnav-home').addClass('active').fadeIn(200);

            // Set 'كل الأدوات المنزلية' as active link in subnav
            $('#subnav-home .subnav-link').removeClass('active');
            $('#subnav-home .subnav-link').first().addClass('active');

            $('#paris-section-title-clothes').hide();
            $('#paris-section-title-home').fadeIn(200);

            filterProductsByMall('home');
        }

        if (pushHistory && window.history && window.history.pushState) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('mall', mall);
            currentUrl.searchParams.delete('filter');
            window.history.pushState({ mall: mall }, '', currentUrl.toString());
        }
    }

    $(document).on('click', '.paris-mall-tab', function(e) {
        const $tab = $(this);
        const mall = $tab.data('mall');
        const url  = $tab.data('url');

        if ($('body').hasClass('home') || $('body').hasClass('paris-home-page')) {
            e.preventDefault();
            switchToMall(mall, true);
        } else {
            window.location.href = url;
        }
    });

    // Handle browser Back / Forward buttons
    window.addEventListener('popstate', function(event) {
        if ($('body').hasClass('home') || $('body').hasClass('paris-home-page')) {
            const urlParams = new URLSearchParams(window.location.search);
            const mall = urlParams.get('mall') || (event.state && event.state.mall) || 'clothes';
            switchToMall(mall, false);
            const filter = urlParams.get('filter') || (event.state && event.state.filter);
            if (filter) {
                applyCategoryFilter(filter, false);
            }
        }
    });

    function filterProductsByMall(mall) {
        $('.paris-products-section ul.products li.product').each(function() {
            const cat = $(this).attr('data-category') || '';
            const cats = cat.split(/\s+/);
            if (mall === 'clothes') {
                if (cats.indexOf('clothes') !== -1 || cats.indexOf('men') !== -1 || cats.indexOf('women') !== -1 || cats.indexOf('kids') !== -1) {
                    $(this).removeClass('is-hidden').fadeIn(200);
                } else {
                    $(this).addClass('is-hidden').hide();
                }
            } else {
                if (cats.indexOf('home') !== -1 || cats.indexOf('kitchen') !== -1 || cats.indexOf('decor') !== -1 || cats.indexOf('textiles') !== -1 || cats.indexOf('cleaning') !== -1 || cats.indexOf('organization') !== -1) {
                    $(this).removeClass('is-hidden').fadeIn(200);
                } else {
                    $(this).addClass('is-hidden').hide();
                }
            }
        });
    }

    // Instant Category Filter driven by the main top subnav
    function applyCategoryFilter(filter, pushHistory) {
        if (!filter || filter === 'all') {
            $('.paris-products-section ul.products li.product').removeClass('is-hidden').fadeIn(200);
        } else if (filter === 'clothes') {
            filterProductsByMall('clothes');
        } else if (filter === 'home') {
            filterProductsByMall('home');
        } else {
            $('.paris-products-section ul.products li.product').each(function() {
                const cat = $(this).attr('data-category') || '';
                const cats = cat.split(/\s+/);
                if (cats.indexOf(filter) !== -1) {
                    $(this).removeClass('is-hidden').fadeIn(200);
                } else {
                    $(this).addClass('is-hidden').hide();
                }
            });
        }

        // Highlight the corresponding link in the top subnav bar
        $('.paris-subnav-list a.subnav-link').each(function() {
            const href = $(this).attr('href') || '';
            if (href.indexOf('/' + filter + '/') !== -1 || href.endsWith('/' + filter) || href.endsWith('/' + filter + '/')) {
                $('.paris-subnav-list a.subnav-link').removeClass('active');
                $(this).addClass('active');
            }
        });

        if (pushHistory && window.history && window.history.pushState) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('filter', filter);
            window.history.pushState({ filter: filter }, '', currentUrl.toString());
        }
    }

    // Top Subnav item click on Homepage: smoothly filter products grid
    $(document).on('click', '.paris-subnav-list a.subnav-link:not(.subnav-discount)', function(e) {
        if ($('body').hasClass('home') || $('body').hasClass('paris-home-page')) {
            const href = $(this).attr('href') || '';
            let filter = '';
            if (href.indexOf('/clothes/men') !== -1) filter = 'men';
            else if (href.indexOf('/clothes/women') !== -1) filter = 'women';
            else if (href.indexOf('/clothes/kids') !== -1) filter = 'kids';
            else if (href.indexOf('/clothes') !== -1) filter = 'clothes';
            else if (href.indexOf('/home/kitchen') !== -1) filter = 'kitchen';
            else if (href.indexOf('/home/decor') !== -1) filter = 'decor';
            else if (href.indexOf('/textiles') !== -1) filter = 'textiles';
            else if (href.indexOf('/home/organization') !== -1) filter = 'organization';
            else if (href.indexOf('/home/cleaning') !== -1) filter = 'cleaning';
            else if (href.indexOf('/home') !== -1) filter = 'home';

            if (filter) {
                e.preventDefault();
                $('.paris-subnav-list a.subnav-link').removeClass('active');
                $(this).addClass('active');

                // Determine mall
                const isHome = ['home', 'kitchen', 'decor', 'textiles', 'organization', 'cleaning'].indexOf(filter) !== -1;
                const targetMall = isHome ? 'home' : 'clothes';
                
                // Switch mall if different
                const activeMall = $('.paris-mall-tab.active').data('mall');
                if (activeMall !== targetMall) {
                    switchToMall(targetMall, false);
                    $('.paris-subnav-list a.subnav-link').removeClass('active');
                    $(this).addClass('active');
                }

                applyCategoryFilter(filter, true);

                // Smooth scroll to products section
                const $productsSec = $('.paris-products-section');
                if ($productsSec.length) {
                    $('html, body').animate({
                        scrollTop: $productsSec.offset().top - 70
                    }, 350);
                }
            }
        }
    });

    // Run active filter on load and support direct ?mall= or ?filter= URLs
    $(function() {
        if ($('body').hasClass('home') || $('body').hasClass('paris-home-page')) {
            const urlParams = new URLSearchParams(window.location.search);
            const mallParam = urlParams.get('mall');
            const filterParam = urlParams.get('filter');

            if (mallParam) {
                switchToMall(mallParam, false);
                if (filterParam) {
                    applyCategoryFilter(filterParam, false);
                }
            } else if (filterParam) {
                const mall = (['clothes', 'men', 'women', 'kids'].indexOf(filterParam) !== -1) ? 'clothes' : 'home';
                switchToMall(mall, false);
                applyCategoryFilter(filterParam, false);
            } else {
                switchToMall('clothes', false);
            }
        }
    });

    // Wishlist Heart Toggle
    $(document).on('click', '.paris-heart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).toggleClass('favorited');
    });

    // ============================================================
    // AMAZON-STYLE CART SELECTION INTERACTION
    // ============================================================
    function updateCartSelectionUI() {
        const $checkboxes = $('.paris-cart-item-checkbox');
        if ($checkboxes.length === 0) return;

        let selectedCount = 0;
        let selectedTotal = 0;
        const totalCount    = $checkboxes.length;
        const selectedKeys = [];

        $checkboxes.each(function() {
            const $cb   = $(this);
            const $row  = $cb.closest('tr.woocommerce-cart-form__cart-item');
            const $tag  = $row.find('.paris-unselected-tag');
            const key   = $cb.data('cart-key');
            const total = parseFloat($cb.data('line-total')) || 0;

            if ($cb.is(':checked')) {
                selectedCount++;
                selectedTotal += total;
                selectedKeys.push(key);
                $row.removeClass('paris-item-unselected');
                $tag.hide();
            } else {
                $row.addClass('paris-item-unselected');
                $tag.show();
            }
        });

        // تحديث أرقام الشريط
        $('.paris-selected-count').text(selectedCount);
        const allSelected = (selectedCount === totalCount);
        $('#paris-select-all-toggle').prop('checked', allSelected);
        $('#paris-btn-toggle-all').text(allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل');

        // تحديث المجموع الفرعي المعروض
        const formattedTotal = Math.round(selectedTotal) + ' ج.م';
        $('tr.cart-subtotal td').html('<span class="woocommerce-Price-amount amount">' + formattedTotal + '</span>');
        $('tr.order-total td').html('<strong><span class="woocommerce-Price-amount amount">' + formattedTotal + '</span></strong>');

        // تحديث زر إتمام الطلب والتحكم فيه
        const $checkoutBtn = $('.checkout-button');
        if ($checkoutBtn.length) {
            if (selectedCount > 0) {
                $checkoutBtn.removeClass('paris-disabled-checkout');
                $checkoutBtn.css({ 'pointer-events': '', 'opacity': '' });
                let countLabel = selectedCount + ' ' + (selectedCount === 1 ? 'منتج' : (selectedCount === 2 ? 'منتجين' : 'منتجات'));
                $checkoutBtn.html('متابعة الشراء (' + countLabel + ') ←');
                $('#paris-cart-zero-notice').remove();
            } else {
                $checkoutBtn.addClass('paris-disabled-checkout');
                $checkoutBtn.css({ 'pointer-events': 'none', 'opacity': '0.5' });
                $checkoutBtn.html('اختر منتجاً واحداً على الأقل للشراء');
                if ($('#paris-cart-zero-notice').length === 0) {
                    $checkoutBtn.after('<div id="paris-cart-zero-notice" style="color:#d9534f;font-size:13px;font-weight:700;margin-top:8px;text-align:center;">⚠️ يرجى تحديد منتج واحد على الأقل للمتابعة إلى الدفع.</div>');
                }
            }
        }

        // إرسال التحديد في الخلفية عبر AJAX لحفظه في الجلسة
        if (typeof parisAjax !== 'undefined' && parisAjax.ajaxurl) {
            $.post(parisAjax.ajaxurl, {
                action: 'paris_save_cart_selection',
                selected_keys: selectedKeys,
                nonce: parisAjax.nonce
            });
        }
    }

    // تبديل اختيار عنصر واحد
    $(document).on('change', '.paris-cart-item-checkbox', function() {
        updateCartSelectionUI();
    });

    // تبديل اختيار الكل من الـ Checkbox الرئيسي
    $(document).on('change', '#paris-select-all-toggle', function() {
        const isChecked = $(this).is(':checked');
        $('.paris-cart-item-checkbox').prop('checked', isChecked);
        updateCartSelectionUI();
    });

    // تبديل اختيار الكل من زر الأكشن النصي
    $(document).on('click', '#paris-btn-toggle-all', function(e) {
        e.preventDefault();
        const $toggle = $('#paris-select-all-toggle');
        const newState = !$toggle.is(':checked');
        $toggle.prop('checked', newState);
        $('.paris-cart-item-checkbox').prop('checked', newState);
        updateCartSelectionUI();
    });

    // تشغيل التحديث فور تحميل الصفحة
    $(function() {
        if ($('body').hasClass('woocommerce-cart')) {
            updateCartSelectionUI();
        }
    });

    // ============================================================
    // SIDE CART DRAWER SELECTION INTERACTION
    // ============================================================
    function updateDrawerSelectionUI() {
        const $checkboxes = $('.paris-drawer-item-checkbox');
        if ($checkboxes.length === 0) return;

        let selectedCount = 0;
        let selectedTotal = 0;
        const totalCount  = $checkboxes.length;
        const selectedKeys = [];

        $checkboxes.each(function() {
            const $cb   = $(this);
            const $row  = $cb.closest('.paris-cart-item');
            const $note = $row.find('.paris-drawer-unselected-note');
            const key   = $cb.data('key');
            const total = parseFloat($cb.data('line-total')) || 0;

            if ($cb.is(':checked')) {
                selectedCount++;
                selectedTotal += total;
                selectedKeys.push(key);
                $row.removeClass('is-unselected');
                $note.hide();
            } else {
                $row.addClass('is-unselected');
                $note.show();
            }
        });

        $('.paris-drawer-sel-num').text(selectedCount);
        const allSelected = (selectedCount === totalCount);
        $('#paris-drawer-select-all').prop('checked', allSelected);

        const formattedTotal = Math.round(selectedTotal) + ' ج.م';
        $('.paris-cart-total-value').text(formattedTotal);

        const $checkoutBtn = $('.paris-cart-checkout-btn');
        if ($checkoutBtn.length) {
            if (selectedCount > 0) {
                $checkoutBtn.css({ 'pointer-events': '', 'opacity': '' });
                let countLabel = selectedCount + ' ' + (selectedCount === 1 ? 'منتج' : (selectedCount === 2 ? 'منتجين' : 'منتجات'));
                $checkoutBtn.html('كمّل طلبك (' + countLabel + ') &larr;');
                $('#paris-drawer-zero-notice').remove();
            } else {
                $checkoutBtn.css({ 'pointer-events': 'none', 'opacity': '0.5' });
                $checkoutBtn.html('اختر منتجاً واحداً للشراء');
                if ($('#paris-drawer-zero-notice').length === 0) {
                    $checkoutBtn.after('<div id="paris-drawer-zero-notice" style="color:#d9534f;font-size:12.5px;font-weight:700;margin-top:8px;text-align:center;">⚠️ يرجى تحديد منتج واحد على الأقل للشراء.</div>');
                }
            }
        }

        if (typeof parisAjax !== 'undefined' && parisAjax.ajaxurl) {
            $.post(parisAjax.ajaxurl, {
                action: 'paris_save_cart_selection',
                selected_keys: selectedKeys,
                nonce: parisAjax.nonce
            });
        }
    }

    $(document).on('change', '.paris-drawer-item-checkbox', function() {
        updateDrawerSelectionUI();
    });

    $(document).on('change', '#paris-drawer-select-all', function() {
        const isChecked = $(this).is(':checked');
        $('.paris-drawer-item-checkbox').prop('checked', isChecked);
        updateDrawerSelectionUI();
    });

})(jQuery);


