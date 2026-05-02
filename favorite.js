(function () {
    'use strict';

    var STATUS_TYPES = ['look', 'viewed', 'scheduled', 'continued', 'thrown'];
    var FAVORITE_TYPES = ['book', 'like', 'wath', 'history'];
    var lastCardData = null;

    function addStyles() {
        var rules = [
            '.full-start__custom-status {',
            ' display: inline-block;',
            ' font-size: 1.2em;',
            ' padding: 0.3em;',
            ' border-radius: 0.25em;',
            ' border: 1px solid currentColor;',
            ' background: rgba(0, 0, 0, 0.15);',
            ' margin-right: 0.5em;',
            ' white-space: nowrap;',
            ' vertical-align: middle;',
            ' font-weight: 500;',
            '}',
            '.full-start__custom-status.hide { display: none; }',
            '.full-start__custom-status--look { color: #5DBFF5; }',
            '.full-start__custom-status--viewed { color: #FFD028; }',
            '.full-start__custom-status--scheduled { color: #ffffff; }',
            '.full-start__custom-status--thrown { color: #E54747; }',
            '.full-start__custom-status--continued { color: #be95ff; }'
        ].join('\n');

        $('<style>' + rules + '</style>').appendTo('head');
    }

    function getActiveCard() {
        var active = Lampa.Activity.active();
        return active && active.card;
    }

    function updateFullStatus() {
        var active = Lampa.Activity.active();
        if (!active || active.component !== 'full' || !active.card) return;

        var body = $(active.activity.body);
        var favStatus = Lampa.Favorite.check(active.card);
        var activeMark = null;

        for (var i = 0; i < STATUS_TYPES.length; i++) {
            if (favStatus[STATUS_TYPES[i]]) {
                activeMark = STATUS_TYPES[i];
                break;
            }
        }

        var customStatus = body.find('.full-start__custom-status');

        if (activeMark) {
            if (!customStatus.length) {
                customStatus = $('<div class="full-start__custom-status"></div>');
                body.find('.full-start-new__rate-line').append(customStatus);
            }
            var label = Lampa.Lang.translate('title_' + activeMark);
            customStatus
                .text(label)
                .attr('class', 'full-start__custom-status full-start__custom-status--' + activeMark);
        } else if (customStatus.length) {
            customStatus.addClass('hide');
        }
    }

    function buildMenuItems(items, card) {
        var favStatus = card ? Lampa.Favorite.check(card) : {};
        var result = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var where = item.where || item.type;

            if (STATUS_TYPES.indexOf(where) >= 0) {
                result.push({
                    title: item.title,
                    where: item.where,
                    type: item.type,
                    picked: favStatus[where],
                    onSelect: function () {
                        if (card) Lampa.Favorite.toggle(where, card);
                    }
                });
            } else {
                result.push(item);
            }
        }

        return result;
    }

    function init() {
        if (!window.Lampa || !Lampa.Select || !Lampa.Select.listener) return;

        addStyles();

        if (Lampa.Emit && Lampa.Emit.prototype && Lampa.Emit.prototype.emit) {
            var originalEmit = Lampa.Emit.prototype.emit;
            Lampa.Emit.prototype.emit = function (event) {
                if (event === 'menu' && this.data) lastCardData = this.data;
                return originalEmit.apply(this, arguments);
            };
        }

        Lampa.Select.listener.follow('close', function () {
            lastCardData = null;
        });

        Lampa.Select.listener.follow('preshow', function (e) {
            var titleAction = Lampa.Lang.translate('title_action');
            var titleLinks = Lampa.Lang.translate('settings_input_links');
            if (!e || !e.active || (e.active.title !== titleAction && e.active.title !== titleLinks)) return;

            var card = getActiveCard() || lastCardData;
            e.active.items = buildMenuItems(e.active.items, card);
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'start' || e.type === 'complite') updateFullStatus();
        });

        Lampa.Listener.follow('state:changed', function (e) {
            if (e.target === 'favorite') updateFullStatus();
        });

        updateFullStatus();
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
