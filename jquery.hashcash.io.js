/* global HashcashIO, jQuery */
(function($) {
    var defaultHashcashUrl = window.HashcashIOUrl || 'https://hashcash.io';

    var defaultSettings = {
        complexity: 0.01,
        key: null,
        beforeCb: null,
        progressCb: null,
        doneCb: null,
        formEl: null,
        hashcashInputElName: 'hashcashid',
        lang: {
            progressTimeLeft    : 'Please wait __timeLeft__ more seconds before submitting form.',
            progress            : 'Please wait before submitting form.',
            notSupportedBrowser : 'Your browser is not supported. Please use latest version of Chrome, Firefox or Internet Explorer.',
            runtimeError        : 'Runtime error. Please try to refresh page.',
            formReady           : 'You can submit form now.'
        },
        templates: {
            widget:
                '<a href="#" class="hashcash-widget">' +
                  '<span class="hashcash-widget-progress">' +
                    '<span class="hashcash-widget-progress-bar"></span>' +
                  '</span>' +
                '</a>',
            message:
                '<span class="hashcash-message-box">' +
                '</span>'
        }
    };

    $.fn.hashcash = function(options) {
        if (typeof options === 'string' && $.fn.hashcash[options]) {
            var func = options;
            arguments[0] = $(this);
            return $.fn.hashcash[func].apply($.fn.hashcash, arguments);
        }

        if (! options.key) {
            throw new Error('`key` options is required for jQuery hashcash');
        }

        var settings = $.extend(true, $.fn.hashcash.defaultSettings, options );

        // Pre-load Hashcash API
        $.fn.hashcash.getHashcashInstance(this, settings);

        return this.each(function() {
            $.fn.hashcash.addWidget.apply(this, [settings]);
        });
    };

    $.fn.hashcash.apiRev = 1;
    $.fn.hashcash.defaultSettings = defaultSettings;
    $.fn.hashcash.clients = {};

    $.fn.hashcash.createWidget = function createWidget($el) {
        $el.each(function() {
            var $el = $(this);
            var settings = $el.data('hashcash-settings');

            var $widget = $(settings.templates.widget);
            $widget.data('button', $el)
                   .click(function(e) {
                       this.focus();
                       e.preventDefault();
                   })
                   .focus(function() {
                       $(this).find('.hashcash-message-box').attr('aria-live', 'assertive');
                   })
                   .blur(function() {
                       $(this).find('.hashcash-message-box').removeAttr('aria-live');
                   });

            $el.data('hashcash-widget', $widget)
               .after($widget);
        });

        $el.hashcash('resizeWidget');

        $(window).resize(function() {
            $el.hashcash('resizeWidget');
        });

        return $el;
    };

    $.fn.hashcash.resizeWidget = function resizeWidget($el) {
        $el.each(function() {
            var $el = $(this);
            var $widget = $el.data('hashcash-widget');
            var width  = $el.outerWidth();
            var height = $el.outerHeight();
            var position = $el.position();

            $widget.css({
                top      : position.top,
                left     : position.left,
                width    : width,
                height   : height,
                position : 'absolute'
            });
        });

        return $el;
    };

    $.fn.hashcash.setProgress = function setProgress($el, progress, timeLeft) {
        $el.each(function() {
            var $el = $(this);
            var settings = $el.data('hashcash-settings');
            var $widget = $el.data('hashcash-widget');

            progress = parseFloat(progress);
            if (progress > 100) { progress = 100; }
            if (progress < 0) { progress = 0; }

            $widget.find('.hashcash-widget-progress-bar').width(progress + '%');

            var $bar = $widget.find('.hashcash-widget-progress-bar');

            if (progress < 100 && progress > 0 && !$bar.is(':visible')) {
                $bar.css({ display: 'block', opacity: 0.01 })
                    .animate({ opacity: 1 });
            }

            var progressMessage = settings.lang.progressTimeLeft.replace('__timeLeft__', timeLeft);

            if (! timeLeft) {
                progressMessage = settings.lang.progress;
            }

            $el.hashcash(
                'displayMessage',
                'info',
                progressMessage
            );

            if (settings.progressCb) {
                settings.progressCb.apply($el);
            }
        });

        $el.hashcash('resizeWidget');

        return $el;
    };

    $.fn.hashcash.getProgress = function getProgres($el) {
        return $el.data('hashcash-progress') || 0;
    };

    $.fn.hashcash.completed = function($el) {
        var settings = $el.data('hashcash-settings');

        $el.hashcash(
            'displayMessage',
            'info',
            settings.lang.formReady,
            true
        );

        $el.data('hashcash-computed', true)
           .addClass('hashcash-computed')
           .removeClass('hashcash-disabled')
           .data('tabindex', $el.data('hashcash-orig-tabindex'))
           .removeAttr('disabled');

        var $widget = $el.data('hashcash-widget');
        $widget.animate({ opacity: 0 }, function() { $widget.hide(); });

        if (settings.doneCb) {
            settings.doneCb.apply($el);
        }

        return $el;
    };

    $.fn.hashcash.attachHashcash = function attachHashcash($els, hashcashApi) {
        $els.each(function() {
            var $el = $(this);
            var settings = $el.data('hashcash-settings');

            // Insert proper walletId into form
            var $form = $el.data('hashcash-form');
            var $hashcashField = $form.find('input[name="' + settings.hashcashInputElName + '"]');
            var id = hashcashApi.walletId;
            if ($hashcashField.length < 1) {
                $hashcashField = $('<input type="hidden" name="' + settings.hashcashInputElName + '" />');
                $form.append($hashcashField);
            }
            $hashcashField.val(id);

            hashcashApi.calculate({
                id       : hashcashApi.guid(),
                limit    : settings.complexity,
                progress : function(totalDone, work) {
                    var timeLeft = (work.speed) ? Math.floor((settings.complexity - totalDone) / work.speed / 1000) : false;
                    $el.hashcash('setProgress', totalDone / settings.complexity * 100, timeLeft);
                },
                done     : function() {
                    $el.hashcash('completed');
                }
            });
        });

        return $els;
    };

    $.fn.hashcash.addWidget = function addWidget(settings) {
        var $form;
        var $el = $(this);

        $el.data('hashcash-settings', settings);

        if ($el.data('hashcash-widget')) {
            var $widget = $el.data('hashcash-widget');
            $widget.find('.hashcash-widget-progress-bar').hide();
            $widget.show();
        }
        else {
            $el.hashcash('createWidget');
        }

        if (! settings.formEl) {
            $form = $el.parents('form').eq(0);
        }
        else {
            $form = $(settings.formEl);
        }

        if (! $form) {
            throw new Error('Hashcash plugin requires button to be within <form> element. If button located ' +
                            'outside <form> specify form element via settings.formEl');
        }

        $el.data('hashcash-form', $form);

        if (settings.beforeCb) {
            settings.beforeCb.apply($el);
        }

        var origTabindex = $el.attr('tabindex') || 0;

        $el.hashcash('setProgress', 0)
           .removeClass('hashcash-computed')
           .addClass('hashcash-disabled')
           .data('hashcash-computed', false)
           .data('hashcash-orig-tabindex', origTabindex)
           .attr('disabled', true)
           .attr('tabindex', -1);

        $form.submit(function(e) {
            if (! $el.data('hashcash-computed')) {
                e.preventDefault();
            }
        });

        if ($.fn.hashcash.apiError) {
            $el.hashcash('onApiError', $.fn.hashcash.apiError);
            return;
        }

        $el.hashcash(
            'getHashcashInstance',
            settings,
            $el.hashcash.attachHashcash
        );
    };

    $.fn.hashcash.loadScript = function loadScript(url, callback){
        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState){  //IE
            script.onreadystatechange = function() {
                if (script.readyState === "loaded" ||
                    script.readyState === "complete")
                {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function() {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    // This will first check if HashcashIO API client library is loaded, and if it is not
    // kickstart async load. If another getHashcashInstance() call happen, it will wait till
    // script async load done and proceed as usual.
    //
    // @TODO: probably needs to be rethought
    $.fn.hashcash.getHashcashInstance = function getHashcashInstance($el, options, cb) {
        var self = this;
        var args = arguments;

        if ($.fn.hashcash.hashcashLoading) {
            setTimeout(function() {
                $.fn.hashcash.getHashcashInstance.apply(self, args);
            }, 10);

            return;
        }

        // If HashcashIO API is not loaded yet, load it asynchroniously
        if (! window.HashcashIO) {
            $.fn.hashcash.hashcashLoading = true;
            var clientApiUrl = defaultHashcashUrl + '/js/client.min.js';
            $.fn.hashcash.loadScript.apply(
                $.fn.hashcash, [
                   clientApiUrl,
                   function() {
                       $.fn.hashcash.afterApiLoadCb.apply(self, args);
                       $.fn.hashcash.hashcashLoading = false;
                       $.fn.hashcash.getHashcashInstance.apply(self, args);
                   }
                ]
            );

            return;
        }

        var hashcash = $.fn.hashcash.clients[options.key];

        if (! hashcash) {
            hashcash = new HashcashIO({
                key         : options.key,
                complexity  : options.complexity,
                hashcashUrl : defaultHashcashUrl,
                onError     : ($el) ? function(err) { $.fn.hashcash.onApiError($el, err); } : null
            });
            $.fn.hashcash.clients[options.key] = hashcash;
        }

        if ($el && cb) {
            cb.apply($el, [$el, hashcash]);
        }
    };

    $.fn.hashcash.onApiError = function($el, err, details) {
        var msg;
        var settings = $el.data('hashcash-settings');

        $.fn.hashcash.apiError = {
            error: err,
            details: details
        };

        switch (err) {
            case 'not supported browser':
                msg = settings.lang.notSupportedBrowser;
                break;
            case 'runtime error':
                msg = settings.lang.runtimeError;
                break;
        }

        $el.hashcash('displayMessage', 'error', msg);

        return $el;
    };

    $.fn.hashcash.displayMessage = function($el, type, message, noNew) {
        $el.each(function() {
            var $widget = $(this).data('hashcash-widget');
            var $msg = $widget.data('message');

            if (!$msg && !noNew) {
                var settings = $el.data('hashcash-settings');
                $msg = $(settings.templates.message);
                $widget.data('message', $msg);
                $widget.append($msg);
                $msg.css({
                    top      : $(this).outerHeight(),
                    left     : $(this).outerWidth() / 2 - $msg.outerWidth() / 2,
                    position : 'absolute'
                });
            }

            $msg.removeClass('hashcash-message-error hashcash-message-info')
                .addClass('hashcash-message-' + type)
                .html(message);
        });

        return $el;
    };

    // To be redifined for custom applications
    $.fn.hashcash.afterApiLoadCb = function afterApiLoadCb() {
    };

}(jQuery));
