(function () {
    'use strict';

    const MY_API_BASE = 'http://192.168.31.24:3000/api/';
    let API_TOKEN = '';

    Lampa.Lang.add({
        videoseed_title: { ru: 'VideoSeed', uk: 'VideoSeed', en: 'VideoSeed', zh: 'VideoSeed', bg: 'VideoSeed' },
        videoseed_nolink: { ru: 'Не удалось найти контент в VideoSeed', uk: 'Не вдалося знайти контент у VideoSeed', en: 'Failed to find content in VideoSeed', zh: '无法在VideoSeed中找到内容', bg: 'Не може да се намери контент в VideoSeed' },
        videoseed_season: { ru: 'Сезон', uk: 'Сезон', en: 'Season', zh: '季' },
        videoseed_translation: { ru: 'Перевод', uk: 'Переклад', en: 'Translation' },
        videoseed_episode: { ru: 'Серия', uk: 'Серія', en: 'Episode' }
    });

    function addTemplates() {
        if ($('#videoseed_css').length) return;
        $('head').append(`
            <style id="videoseed_css">
            .vs-prestige { position:relative; -webkit-border-radius:.3em; border-radius:.3em; background-color:rgba(0,0,0,0.3); display:-webkit-box; display:-webkit-flex; display:-moz-box; display:-ms-flexbox; display:flex; margin-bottom:1.5em; }
            .vs-prestige__body { padding:1.2em; line-height:1.3; -webkit-box-flex:1; -webkit-flex-grow:1; -moz-box-flex:1; -ms-flex-positive:1; flex-grow:1; position:relative; display: flex; flex-direction: column; justify-content: center; }
            .vs-prestige__img { position:relative; width:13em; -webkit-flex-shrink:0; -ms-flex-negative:0; flex-shrink:0; min-height:8.2em; }
            .vs-prestige__img > img { position:absolute; top:0; left:0; width:100%; height:100%; -o-object-fit:cover; object-fit:cover; -webkit-border-radius:.3em; border-radius:.3em; opacity:0; -webkit-transition:opacity .3s; transition:opacity .3s; }
            .vs-prestige__img--loaded > img { opacity:1; }
            .vs-prestige__episode-number { position:absolute; top:0; left:0; right:0; bottom:0; display:-webkit-box; display:-webkit-flex; display:-moz-box; display:-ms-flexbox; display:flex; -webkit-box-align:center; -webkit-align-items:center; align-items:center; -webkit-box-pack:center; -webkit-justify-content:center; justify-content:center; font-size:2em; font-weight:bold; text-shadow: 1px 1px 3px #000; z-index:2; }
            .vs-prestige__head, .vs-prestige__footer { display:-webkit-box; display:-webkit-flex; display:-moz-box; display:-ms-flexbox; display:flex; -webkit-box-pack:justify; -webkit-justify-content:space-between; -moz-box-pack:justify; -ms-flex-pack:justify; justify-content:space-between; -webkit-box-align:center; -webkit-align-items:center; -moz-box-align:center; -ms-flex-align:center; align-items:center; }
            .vs-prestige__title { font-size:1.7em; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; line-clamp:1; -webkit-box-orient:vertical; margin-bottom:0.3em; }
            .vs-prestige__time { padding-left:2em; }
            .vs-prestige__timeline { margin:.8em 0; }
            .vs-prestige__timeline > .time-line { display:block !important; }
            .vs-prestige__info { display:-webkit-box; display:-webkit-flex; display:-moz-box; display:-ms-flexbox; display:flex; -webkit-box-align:center; -webkit-align-items:center; align-items:center; margin-top:0.5em; opacity:0.7; font-size:0.9em; }
            .vs-prestige__info > * { overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; line-clamp:1; -webkit-box-orient:vertical; }
            .vs-prestige__quality { padding-left:1em; white-space:nowrap; }
            .vs-prestige.focus::after { content:''; position:absolute; top:-0.6em; left:-0.6em; right:-0.6em; bottom:-0.6em; border-radius:.7em; border:solid .3em #fff; z-index:-1; pointer-events:none; }
            .vs-prestige__loader { position:absolute; top:50%; left:50%; width:2em; height:2em; margin-left:-1em; margin-top:-1em; background:url(./img/loader.svg) no-repeat center center; background-size:contain; z-index:1; }
            .vs-prestige__viewed { position:absolute; top:1em; left:1em; background:rgba(0,0,0,0.45); border-radius:100%; padding:.25em; font-size:.76em; z-index:2; }
            .vs-prestige__viewed > svg { width:1.5em !important; height:1.5em !important; }
            .vs-empty { padding: 3em; text-align: center; font-size: 1.2em; opacity: 0.7; }
            @media screen and (max-width:480px) {
                .vs-prestige__img { width:7em; min-height:6em; }
                .vs-prestige__title { font-size:1.4em; }
                .vs-prestige__body { padding:.8em 1.2em; }
            }
            </style>
        `);

        Lampa.Template.add('videoseed_card', `
            <div class="vs-prestige selector">
                <div class="vs-prestige__img">
                    <img alt="">
                    <div class="vs-prestige__loader"></div>
                </div>
                <div class="vs-prestige__body">
                    <div class="vs-prestige__head">
                        <div class="vs-prestige__title">{title}</div>
                        <div class="vs-prestige__time">{time}</div>
                    </div>
                    <div class="vs-prestige__timeline"></div>
                    <div class="vs-prestige__footer">
                        <div class="vs-prestige__info">{info}</div>
                        <div class="vs-prestige__quality">{quality}</div>
                    </div>
                </div>
            </div>
        `);
        Lampa.Template.add('videoseed_empty', `<div class="vs-empty">{text}</div>`);
    }

    function VideoSeedComponent(object) {
        let network = new Lampa.Reguest();
        let scroll = new Lampa.Scroll({ mask: true, over: true });
        let files = new Lampa.Explorer(object);
        let filter = new Lampa.Filter(object);

        let last;
        let currentData = null;
        let choice = { season: 0, voice: 0 };
        let seasons = [];
        let voices = [];
        let currentMovie = object.movie || {};
        let isSerial = !!currentMovie.number_of_seasons;
        
        this.playlist = [];

        this.create = function () {
            this.activity.loader(true);

            filter.render().find('.filter--search').remove();

            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('videoseed_season'));
            filter.render().find('.filter--filter span').text(Lampa.Lang.translate('videoseed_translation'));

            filter.onBack = () => {
                this.start();
            };

            filter.onSelect = (type, a, b) => {
                if (type === 'sort') { 
                    choice.season = a.index;
                    choice.voice = 0; 
                    this.updateData();
                    setTimeout(Lampa.Select.close, 10);
                } else if (type === 'filter') { 
                    choice.voice = a.index;
                    this.updateData();
                    setTimeout(Lampa.Select.close, 10);
                }
            };

            scroll.body().addClass('torrent-list');
            
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            
            scroll.minus(files.render().find('.explorer__files-head'));
            
            this.search();

            return files.render();
        };

        this.search = function () {
            let itemType = isSerial ? 'serial' : 'movie';
            let query = (currentMovie.title || currentMovie.name || '');

            let doSearch = () => {
                let url = 'https://api.videoseed.tv/apiv2.php?item=' + itemType + '&token=' + encodeURIComponent(API_TOKEN);

                if (currentMovie.kinopoisk_id) {
                    url += '&kp=' + currentMovie.kinopoisk_id;
                } else if (currentMovie.imdb_id) {
                    url += '&imdb=' + currentMovie.imdb_id;
                } else {
                    url += '&q=' + encodeURIComponent(query);
                }
                url += '&sort_by=kp%20asc';

                network.timeout(15000);
                network.silent(url, (found) => {
                    if (this.activity && this.activity.loader) this.activity.loader(false);

                    if (found.status !== 'success' || !found.data || !found.data.length) {
                        this.showEmpty(Lampa.Lang.translate('videoseed_nolink'));
                        return;
                    }

                    let items = found.data;
                    if (currentMovie.kinopoisk_id) {
                        let exact = items.filter(item => String(item.id_kp) === String(currentMovie.kinopoisk_id));
                        if (exact.length) items = exact;
                    }

                    if (!items.length) {
                        this.showEmpty(Lampa.Lang.translate('videoseed_nolink'));
                        return;
                    }

                    currentData = items[0];
                    choice.season = 0;
                    choice.voice = 0;
                    this.updateData();
                }, () => {
                    if (this.activity && this.activity.loader) this.activity.loader(false);
                    this.showEmpty(Lampa.Lang.translate('videoseed_nolink'));
                }, false, { dataType: 'json' });
            };

            if (!API_TOKEN) {
                network.timeout(5000);
                network.silent(MY_API_BASE + 'token', (res) => {
                    if (res && res.token) {
                        API_TOKEN = res.token;
                        doSearch();
                    } else {
                        if (this.activity && this.activity.loader) this.activity.loader(false);
                        this.showEmpty('Не удалось получить токен авторизации');
                    }
                }, () => {
                    if (this.activity && this.activity.loader) this.activity.loader(false);
                    this.showEmpty('Ошибка соединения при получении токена');
                });
            } else {
                doSearch();
            }
        };

        this.updateData = function () {
            seasons = [];
            voices = [];
            
            let vSet = new Set();

            if (isSerial && currentData.seasons && typeof currentData.seasons === 'object') {
                seasons = Object.keys(currentData.seasons);
                if (choice.season >= seasons.length) choice.season = 0;

                let sData = currentData.seasons[seasons[choice.season]];
                if (sData) {
                    if (sData.translation) vSet.add(sData.translation);
                    
                    if (sData.translation_iframe) {
                        Object.keys(sData.translation_iframe).forEach(k => vSet.add(k));
                    }
                    
                    if (sData.videos) {
                        Object.values(sData.videos).forEach(video => {
                            if (video.translation) vSet.add(video.translation);
                            
                            if (video.translation_iframe) {
                                Object.keys(video.translation_iframe).forEach(k => vSet.add(k));
                            }
                        });
                    }
                }
            } else {
                if (currentData.translation) vSet.add(currentData.translation);
                
                if (currentData.translation_iframe) {
                    Object.keys(currentData.translation_iframe).forEach(k => vSet.add(k));
                }
            }

            voices = Array.from(vSet);

            if (voices.length === 0 && currentData.iframe) {
                voices = ["По умолчанию"];
            }
            
            if (choice.voice >= voices.length) choice.voice = 0;

            this.renderFilter();
            this.renderContent();
        };

        this.renderFilter = function () {
            if (isSerial && seasons.length > 0) {
                let season_items = seasons.map((s, i) => ({
                    title: Lampa.Lang.translate('videoseed_season') + ' ' + s,
                    index: i,
                    selected: i === choice.season
                }));
                filter.set('sort', season_items);
                filter.chosen('sort', [seasons[choice.season]]);
            } else {
                filter.set('sort', []); 
            }

            if (voices.length > 0) {
                let voice_items = voices.map((v, i) => ({
                    title: v,
                    index: i,
                    selected: i === choice.voice
                }));
                filter.set('filter', voice_items);
                filter.chosen('filter', [voices[choice.voice] || "По умолчанию"]);
            } else {
                filter.set('filter', []);
            }
            
            setTimeout(() => {
                filter.render().find('.selector').off('hover:focus').on('hover:focus', (e) => {
                    last = e.target;
                });
            }, 50);
        };

        this.renderContent = function () {
            scroll.clear();
            this.playlist = [];

            let runtime = currentMovie.runtime || (currentMovie.episode_run_time && currentMovie.episode_run_time.length ? currentMovie.episode_run_time[0] : 0);
            let eps = [];

            if (isSerial) {
                let sData = currentData.seasons ? currentData.seasons[seasons[choice.season]] : null;
                if (!sData) {
                    this.showEmpty(Lampa.Lang.translate('videoseed_nolink'));
                    return;
                }
                
                let selectedVoice = voices[choice.voice];
                
                if (sData.videos) {
                    let videoKeys = Object.keys(sData.videos).sort((a, b) => parseInt(a) - parseInt(b));
                    
                    videoKeys.forEach(epNum => {
                        let video = sData.videos[epNum];
                        let epUrl = '';
                        
                        // Собираем все озвучки для конкретно этой серии
                        let all_tr = {};
                        if (video.translation_iframe) {
                            for(let k in video.translation_iframe) all_tr[k] = video.translation_iframe[k].iframe;
                        }
                        if (video.translation && video.iframe) all_tr[video.translation] = video.iframe;
                        
                        // Фоллбэк ссылок до сезона, если у самой серии пустой список
                        if (Object.keys(all_tr).length === 0) {
                            if (sData.translation_iframe) {
                                for(let k in sData.translation_iframe) all_tr[k] = sData.translation_iframe[k].iframe;
                            }
                            if (sData.translation && sData.iframe) all_tr[sData.translation] = sData.iframe;
                        }
                        if (Object.keys(all_tr).length === 0 && video.iframe) all_tr['По умолчанию'] = video.iframe;
                        
                        // Строгая логика поиска ссылки (из первого варианта)
                        if (video.translation_iframe && video.translation_iframe[selectedVoice]) {
                            epUrl = video.translation_iframe[selectedVoice].iframe;
                        } else if (video.translation === selectedVoice && video.iframe) {
                            epUrl = video.iframe;
                        } else if (sData.translation_iframe && sData.translation_iframe[selectedVoice]) {
                            epUrl = sData.translation_iframe[selectedVoice].iframe;
                        } else if (sData.translation === selectedVoice && sData.iframe) {
                            epUrl = sData.iframe;
                        } else if (selectedVoice === 'По умолчанию' && video.iframe) {
                            epUrl = video.iframe;
                        }

                        let timeString = video.time ? video.time : (runtime ? Lampa.Utils.secondsToTime(runtime * 60, true) : '');

                        if (epUrl) {
                            eps.push({
                                title: video.title || video.name || Lampa.Lang.translate('videoseed_episode') + ' ' + epNum,
                                info: selectedVoice || 'По умолчанию',
                                url: epUrl,
                                epNum: parseInt(epNum),
                                preview: video.preview || '',
                                time: timeString,
                                vs_all_translations: all_tr // <--- Инжектируем массив переводов для плеера
                            });
                        }
                    });
                } else {
                    let epUrl = '';
                    
                    let all_tr = {};
                    if (sData.translation_iframe) {
                        for(let k in sData.translation_iframe) all_tr[k] = sData.translation_iframe[k].iframe;
                    }
                    if (sData.translation && sData.iframe) all_tr[sData.translation] = sData.iframe;
                    if (Object.keys(all_tr).length === 0 && sData.iframe) all_tr['По умолчанию'] = sData.iframe;

                    if (sData.translation_iframe && sData.translation_iframe[selectedVoice]) {
                        epUrl = sData.translation_iframe[selectedVoice].iframe;
                    } else if (sData.translation === selectedVoice && sData.iframe) {
                        epUrl = sData.iframe;
                    } else if (selectedVoice === 'По умолчанию' && sData.iframe) {
                        epUrl = sData.iframe;
                    }
                    
                    if (epUrl) {
                        let timeString = sData.time ? sData.time : (runtime ? Lampa.Utils.secondsToTime(runtime * 60, true) : '');

                        eps.push({
                            title: sData.name || Lampa.Lang.translate('videoseed_season') + ' ' + seasons[choice.season],
                            info: selectedVoice,
                            url: epUrl,
                            epNum: null,
                            preview: sData.preview || currentData.preview || '',
                            time: timeString,
                            vs_all_translations: all_tr
                        });
                    }
                }

                if (eps.length === 0) {
                    this.showEmpty("Нет видео для выбранного перевода");
                    return;
                }
            } else {
                let selectedVoice = voices[choice.voice];
                let mUrl = '';
                
                let all_tr = {};
                if (currentData.translation_iframe) {
                    for(let k in currentData.translation_iframe) all_tr[k] = currentData.translation_iframe[k].iframe;
                }
                if (currentData.translation && currentData.iframe) all_tr[currentData.translation] = currentData.iframe;
                if (Object.keys(all_tr).length === 0 && currentData.iframe) all_tr['По умолчанию'] = currentData.iframe;

                if (currentData.translation_iframe && currentData.translation_iframe[selectedVoice]) {
                    mUrl = currentData.translation_iframe[selectedVoice].iframe;
                } else if (currentData.translation === selectedVoice && currentData.iframe) {
                    mUrl = currentData.iframe;
                } else if (selectedVoice === 'По умолчанию' && currentData.iframe) {
                    mUrl = currentData.iframe;
                }

                let timeString = currentData.time ? currentData.time : (runtime ? Lampa.Utils.secondsToTime(runtime * 60, true) : '');

                if (mUrl) {
                    eps.push({
                        title: currentData.name || currentMovie.title || currentMovie.name,
                        info: selectedVoice || 'По умолчанию',
                        url: mUrl,
                        epNum: null,
                        preview: currentData.preview || '',
                        time: timeString,
                        vs_all_translations: all_tr
                    });
                } else {
                    this.showEmpty("Нет видео для выбранного перевода");
                    return;
                }
            }

            eps.forEach((ep) => {
                let epNumForHash = ep.epNum ? ep.epNum : 1;
                let seasonNumber = seasons[choice.season] ? parseInt(seasons[choice.season]) : 1;
                let hash = Lampa.Utils.hash(isSerial ? [seasonNumber, seasonNumber > 10 ? ':' : '', epNumForHash, currentMovie.original_title].join('') : currentMovie.original_title);
                
                let item = {
                    title: ep.title,
                    movie: currentMovie,
                    iframe_url: ep.url,
                    timeline: Lampa.Timeline.view(hash),
                    vs_all_translations: ep.vs_all_translations, // Передаем список в Lampa.Player
                    vs_current_translation: ep.info
                };

                item.url = (call) => {
                    let extract_url = MY_API_BASE + 'extract?url=' + encodeURIComponent(item.iframe_url);
                    network.silent(extract_url, (res) => {
                        if (res && res.success && res.src) {
                            item.url = res.src.trim();
                            call();
                        } else {
                            Lampa.Noty.show('Не удалось извлечь ссылку на видео');
                            item.url = '';
                            call();
                        }
                    }, () => {
                        Lampa.Noty.show('Ошибка соединения при извлечении видео');
                        item.url = '';
                        call();
                    });
                };

                this.playlist.push(item);
            });

            eps.forEach((ep, index) => this.appendCard(ep, index, isSerial));

            scroll.reset();
            
            setTimeout(() => {
                let first = scroll.render().find('.selector').eq(0);
                if (first.length) {
                    last = first[0];
                    if (Lampa.Controller.enabled().name === 'content') {
                        Lampa.Controller.toggle('content');
                    }
                }
            }, 50);
        };

        this.appendCard = function (data, index, showEpNum) {
            let html = Lampa.Template.get('videoseed_card', {
                title: data.title,
                time: data.time || '',
                info: data.info ? `<span>${data.info}</span>` : '',
                quality: data.quality ? `<span>${data.quality}</span>` : ''
            });

            let seasonNumber = seasons[choice.season] ? parseInt(seasons[choice.season]) : 1;
            let epNumForHash = data.epNum ? data.epNum : 1;
            let hash_timeline = Lampa.Utils.hash(isSerial ? [seasonNumber, seasonNumber > 10 ? ':' : '', epNumForHash, currentMovie.original_title].join('') : currentMovie.original_title);
            let hash_behold = Lampa.Utils.hash(isSerial ? [seasonNumber, seasonNumber > 10 ? ':' : '', epNumForHash, currentMovie.original_title, data.info].join('') : currentMovie.original_title + data.info);
            
            let timeline = Lampa.Timeline.view(hash_timeline);
            html.find('.vs-prestige__timeline').append(Lampa.Timeline.render(timeline));
            
            let imgBox = html.find('.vs-prestige__img');
            let img = imgBox.find('img')[0];
            let loader = html.find('.vs-prestige__loader');
            
            img.onerror = function() {
                img.src = './img/img_broken.svg';
            };
            img.onload = function() {
                imgBox.addClass('vs-prestige__img--loaded');
                loader.remove();
                if (showEpNum && data.epNum !== null) {
                    let ep_fmt = data.epNum < 10 ? '0' + data.epNum : data.epNum;
                    imgBox.append(`<div class="vs-prestige__episode-number">${ep_fmt}</div>`);
                }
            };

            let poster = data.preview;
            if (!poster) {
                if (currentMovie.backdrop_path) {
                    poster = Lampa.TMDB.image('t/p/w500' + currentMovie.backdrop_path);
                } else if (currentMovie.poster_path) {
                    poster = Lampa.TMDB.image('t/p/w300' + currentMovie.poster_path);
                } else if (currentData && currentData.poster) {
                    poster = currentData.poster;
                }
            }

            img.src = poster || './img/img_broken.svg';

            let viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
                html.find('.vs-prestige__img').append('<div class="vs-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
            }

            html.on('hover:enter', () => {
                if (currentMovie.id) Lampa.Favorite.add('history', currentMovie, 100);
                
                let viewed = Lampa.Storage.cache('online_view', 5000, []);
                if (viewed.indexOf(hash_behold) === -1) {
                    viewed.push(hash_behold);
                    Lampa.Storage.set('online_view', viewed);
                    if (html.find('.vs-prestige__viewed').length === 0) {
                        html.find('.vs-prestige__img').append('<div class="vs-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                    }
                }
                
                let play_item = this.playlist[index];
                
                Lampa.Loading.start(() => {
                    network.clear();
                    Lampa.Loading.stop();
                });

                if (typeof play_item.url === 'function') {
                    play_item.url(() => {
                        Lampa.Loading.stop();
                        if (play_item.url) {
                            Lampa.Player.play(play_item);
                            Lampa.Player.playlist(this.playlist);
                        }
                    });
                } else {
                    Lampa.Loading.stop();
                    if (play_item.url) {
                        Lampa.Player.play(play_item);
                        Lampa.Player.playlist(this.playlist);
                    }
                }
            }).on('hover:focus', (e) => {
                last = e.target;
                scroll.update($(e.target), true);
            });

            scroll.append(html);
        };

        this.showEmpty = function (msg) {
            scroll.clear();
            scroll.append(Lampa.Template.get('videoseed_empty', { text: msg }));
        };

        this.render = function () {
            return files.render();
        };

        let nav = (dir) => {
            let filterBtns = files.render().find('.filter--sort, .filter--filter').filter(':visible').toArray();
            let listItems = scroll.render().find('.selector').filter(':visible').toArray();
            
            let collection = filterBtns.concat(listItems);
            if (!collection.length) return false;
            
            let current = document.activeElement;
            if (!current || !current.classList.contains('selector')) current = last;
            
            let currentIdx = collection.indexOf(current);
            if (currentIdx === -1) {
                Lampa.Controller.collectionFocus(collection[0], files.render());
                return true;
            }

            if (dir === 'left') {
                if (filterBtns.includes(current)) {
                    let idx = filterBtns.indexOf(current);
                    if (idx > 0) {
                        Lampa.Controller.collectionFocus(filterBtns[idx - 1], files.render());
                        return true;
                    }
                }
                return false;
            }
            
            if (dir === 'right') {
                if (filterBtns.includes(current)) {
                    let idx = filterBtns.indexOf(current);
                    if (idx < filterBtns.length - 1) {
                        Lampa.Controller.collectionFocus(filterBtns[idx + 1], files.render());
                        return true;
                    }
                }
                return false;
            }

            if (dir === 'up') {
                if (currentIdx > 0) {
                    if (listItems.includes(current)) {
                        let idx = listItems.indexOf(current);
                        if (idx === 0) {
                            if (filterBtns.length) {
                                Lampa.Controller.collectionFocus(filterBtns[0], files.render());
                                return true;
                            }
                        } else {
                            Lampa.Controller.collectionFocus(listItems[idx - 1], scroll.render());
                            return true;
                        }
                    }
                }
                return false;
            }
            
            if (dir === 'down') {
                if (currentIdx < collection.length - 1) {
                    if (filterBtns.includes(current)) {
                        if (listItems.length) {
                            Lampa.Controller.collectionFocus(listItems[0], scroll.render());
                            return true;
                        }
                    } else if (listItems.includes(current)) {
                        let idx = listItems.indexOf(current);
                        if (idx < listItems.length - 1) {
                            Lampa.Controller.collectionFocus(listItems[idx + 1], scroll.render());
                            return true;
                        }
                    }
                }
                return false;
            }
            return false;
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function () {
                    if (!nav('up')) Lampa.Controller.toggle('head');
                },
                down: function () {
                    nav('down');
                },
                left: function () {
                    if (!nav('left')) Lampa.Controller.toggle('menu');
                },
                right: function () {
                    nav('right');
                },
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.pause = function () { };
        this.stop = function () { };
        this.destroy = function () {
            network.clear();
            files.destroy();
            scroll.destroy();
        };
    }

    Lampa.Component.add('videoseed', VideoSeedComponent);

    function addButton(e) {
        if (!e || !e.movie) return;
        if (!e.movie.title && !e.movie.name) return;

        let btn = $(`<div class="full-start__button selector view--videoseed">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3C1.895 3 1 3.895 1 5V19C1 20.105 1.895 21 3 21H21C22.105 21 23 20.105 23 19V5C23 3.895 22.105 3 21 3ZM21 19H3V5H21V19ZM8 15.5L17 12L8 8.5V15.5Z"/>
            </svg>
            <span>${Lampa.Lang.translate('videoseed_title')}</span>
        </div>`);
        
        btn.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: Lampa.Lang.translate('videoseed_title'),
                component: 'videoseed',
                movie: e.movie,
                page: 1
            });
        });

        let container = null;
        if (e.render && e.render.length) {
            container = e.render.closest('.full-start-new, .full-start').find('.buttons--container');
        }
        if (!container || !container.length) {
            container = $('.buttons--container');
        }

        container.find('.view--videoseed').remove();
        let trailerBtn = container.find('.view--trailer');
        if (trailerBtn.length) trailerBtn.after(btn);
        else container.append(btn);
    }

    let isPlayerListenerAdded = false;

    function initPlugin() {
        addTemplates();
        
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && e.data && e.data.movie) {
                addButton({
                    render: e.object.activity.render(),
                    movie: e.data.movie
                });
            }
        });

        // ПЕРЕХВАТ ПЛЕЕРА: слушаем старт, переназначаем кнопку озвучек
        if (!isPlayerListenerAdded) {
            isPlayerListenerAdded = true;
            Lampa.Player.listener.follow('full', function (e) {
                if (e.type === 'start') {
                    let playing = Lampa.Player.playing();
                    
                    if (playing && playing.vs_all_translations) {
                        setTimeout(() => {
                            let panel = Lampa.Player.render().find('.player-panel');
                            let track_btn = panel.find('.player-panel__tracks');
                            
                            if (track_btn.length) {
                                // Заставляем иконку динамика отображаться
                                track_btn.removeClass('hide').show();
                                
                                // Отвязываем стандартный hover:enter от player_panel.js
                                track_btn.off('hover:enter click').on('hover:enter click', function () {
                                    let items = [];
                                    for (let name in playing.vs_all_translations) {
                                        items.push({
                                            title: name,
                                            url: playing.vs_all_translations[name],
                                            selected: name === playing.vs_current_translation
                                        });
                                    }
                                    
                                    // Открываем собственное меню Lampa Select
                                    Lampa.Select.show({
                                        title: 'Озвучки',
                                        items: items,
                                        onSelect: function (a) {
                                            Lampa.Select.close();
                                            if (a.selected) return;
                                            
                                            playing.vs_current_translation = a.title;
                                            playing.iframe_url = a.url;
                                            
                                            // Запоминаем время, чтобы восстановить
                                            let currentTime = Lampa.Player.video.currentTime;
                                            let paused = Lampa.Player.video.paused;
                                            
                                            Lampa.Loading.start(() => { let net = new Lampa.Reguest(); net.clear(); Lampa.Loading.stop(); });
                                            
                                            let extract_url = MY_API_BASE + 'extract?url=' + encodeURIComponent(a.url);
                                            let network = new Lampa.Reguest();
                                            
                                            network.silent(extract_url, (res) => {
                                                Lampa.Loading.stop();
                                                if (res && res.success && res.src) {
                                                    playing.url = res.src.trim();
                                                    Lampa.Player.play(playing);
                                                    
                                                    // Восстанавливаем позицию просмотра после смены ссылки
                                                    let seekHandler = function() {
                                                        Lampa.Player.video.currentTime = currentTime;
                                                        if (!paused) Lampa.Player.video.play();
                                                        Lampa.Player.video.removeEventListener('loadedmetadata', seekHandler);
                                                        Lampa.Player.video.removeEventListener('canplay', seekHandler);
                                                    };
                                                    
                                                    Lampa.Player.video.addEventListener('loadedmetadata', seekHandler);
                                                    Lampa.Player.video.addEventListener('canplay', seekHandler); 
                                                } else {
                                                    Lampa.Noty.show('Не удалось извлечь ссылку на видео');
                                                }
                                            }, () => {
                                                Lampa.Loading.stop();
                                                Lampa.Noty.show('Ошибка соединения');
                                            });
                                        },
                                        onBack: function () {
                                            // Корректно возвращаем управление панели плеера
                                            Lampa.Controller.toggle('player_panel');
                                        }
                                    });
                                });
                            }
                        }, 200); 
                    }
                }
            });
        }

        try {
            var active = Lampa.Activity.active();
            if (active && active.component === 'full' && active.card) {
                addButton({
                    render: active.activity.render(),
                    movie: active.card
                });
            }
        } catch (e) { }
    }

    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }
})();
