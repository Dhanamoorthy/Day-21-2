var app = {
    downloads: [],

    api: function(endpoint) {
        endpoint = endpoint || '';
        endpoint = endpoint.replace('https://api.iconfinder.com/v4/', '');

        return 'https://iconfinder-api-auth.herokuapp.com/v4/' + endpoint;
    },

    consoleLog: function(request, response) {
        var template = $('#log-template').html();
        var compile = _.template(template);
        var data = {
            type: request.type,
            url: request.url,
            response: JSON.stringify(response, null, 2)
        };

        $('#console .log').html(compile(data));
    },

    indicateLoading: function(state) {
        $('#search button i').toggleClass('fa-circle-o-notch fa-spin', state);
        $('#search input[type="text"]').attr('disabled', state);
    },

    search: function(e) {
        e.preventDefault();

        if( $('#search #query').val().trim().toString().length > 0 ) {
            var query = $('#search').serialize();

            app.indicateLoading(true);

            $.getJSON(app.api('icons/search?' + query), function(result) {
                app.renderResults(result);
                app.indicateLoading(false);
                app.consoleLog(this, result);
            });
        }

        $('.results').hide().empty();
    },

    renderResults: function(data) {
        var html = '';
        var template = $('#result-template').html();
        var compile = _.template(template);

        if( data.total_count > 0 ) {
            $.each(data.icons, function(index, icon) {
                var file = _.last(icon.raster_sizes);
                html += compile({
                    url: file.formats[0].preview_url,
                    icon_id: icon.icon_id
                });
            });

            $('.results').html(html).fadeIn();

            this.makeDraggable();
        }
    },

    toggleResults: function() {
        var input = $(this).val().trim();
        var results = $('.results').children();

        if( input.length > 0 && results.length > 0 ) {
            $('.results').fadeIn();
        }
    },

    makeDraggable: function() {
        $('.results').find('img').draggable({
            appendTo: 'main',
            containment: 'main',
            addClasses: false,
            scroll: false,
            revert: 'invalid',
            cursor: 'move',
            revertDuration: 200,
            helper: 'clone',
            start: function() {
                $('.results').fadeOut();
            }
        });
    },

    makeDroppable: function() {
        $('.diagram .placeholder').droppable({
            accept: '.results img',
            hoverClass: 'active',
            drop: function(event, ui) {
                var holder = $(this);
                var preview = $(ui.draggable).clone().removeClass('ui-draggable-handle');
                var iconId = $(ui.draggable).data('icon-id');

                holder.addClass('filled').html(preview);
                app.getIcon(iconId, holder);
            }
        });
    },

    getIcon: function(id, holder) {
        $.getJSON(app.api('icons/' + id), function(result) {
            var url = result.vector_sizes[0].formats[0].download_url;

            app.download(url, holder);
            app.downloads.push(id);
            app.downloads = _.uniq(app.downloads);

            $('#downloads strong').html(app.downloads.length);
            app.consoleLog(this, result);
        });
    },

    download: function(url, holder) {
        $.ajax({
            url: app.api(url),
            type: 'GET',
            success: function(data) {
                var svg = $(data).find('svg').prop('outerHTML');

                holder.find('img').attr('src', 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
            }
        });
    },

    bindEvents: function() {
        $('#search').on('submit', app.search);
        $('#search input').on('focus', app.toggleResults);
        $('#search').on('change', 'input[type="checkbox"]', app.search);
        $('.toggle-console').on('click', function() {
            $('aside').toggleClass('active');
        });
    },

    init: function() {
        this.makeDroppable();
        this.bindEvents();
    }
};

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{-(.*?)\}\}/g
};

$(function() {
    app.init();
});