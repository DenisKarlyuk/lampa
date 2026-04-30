(function () {
    'use strict';
    const status = ['look', 'viewed', 'scheduled', 'thrown'];
    const favorite = ['book', 'like', 'wath', 'history'];
    let lastCardData = null;

    function init() {
        if (!window.Lampa || !Lampa.Select || !Lampa.Select.listener) {
            return;
        }

        const originalEmit = Lampa.Emit.prototype.emit;

        Lampa.Emit.prototype.emit = function (event) {
            if (event === 'menu' && this.data) {
                lastCardData = this.data;
            }
            return originalEmit.apply(this, arguments);
        };

        Lampa.Select.listener.follow('close', () => {
            lastCardData = null;
        });

        Lampa.Select.listener.follow('preshow', (e) => {
            if ([
                Lampa.Lang.translate('title_action'),
                Lampa.Lang.translate('settings_input_links')
            ].includes(e?.active?.title)) {
                console.log('Menu items:', e.active.items);
                console.log('Card data:', lastCardData);

                e.active.items = e.active.items
                    .map((item) => status.includes(item.where) || status.includes(item.type) 
                        ? {
                            title: item.title,
                            where: item.where,
                            type: item.type,
                            onSelect: (e, w) => {
                                let card = Lampa.Activity.active()
                                console.log('Selected card data:', lastCardData, card);
                                Lampa.Favorite.toggle(item.where, lastCardData);
                            },
                        } : item
                    ).filter((item) => (
                        item.separator 
                        || favorite.includes(item.where) 
                        || status.includes(item.where)
                        || favorite.includes(item.type) 
                        || status.includes(item.type)
                    ));
            }
        });
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type == 'ready') init();
        });
    }
})();
