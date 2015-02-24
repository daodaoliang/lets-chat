'use strict';

if (typeof window !== 'undefined' && typeof exports === 'undefined') {
    if (typeof window.utils !== 'object') {
        window.utils = {};
    }
}

if (typeof exports !== 'undefined') {
    var _ = require('underscore');
}

(function(exports) {
    //
    // Message Text Formatting
    //

    var markdownit = window.markdownit({
        html: false,
        linkify: true,
        breaks: true
    });

    var link_open = markdownit.renderer.rules.link_open;

    markdownit.renderer.rules.link_open = function (tokens, idx) {
        if (!tokens[idx].target) {
            tokens[idx].target = '_blank';
        }

        return link_open(tokens, idx);
    };

    function getBaseUrl() {
        var parts = window.location.pathname.split('/');

        parts = _.filter(parts, function(part) {
            return part.length;
        });

        if (parts.length) {
            parts.splice(parts.length - 1, 1);
        }

        var path = window.location.origin;

        if (parts.length) {
            path = path + '/' + parts.join('/');
        }

        return path + '/';
    }

    function trim(text) {
        return text.trim();
    }

    function mentions(text) {
        var mentionPattern = /\B@([\w\.]+)(?!@)\b/g;
        return text.replace(mentionPattern, '<strong>@$1</strong>');
    }

    function roomLinks(text, data) {
        if (!data.rooms) {
            return text;
        }

        var slugPattern = /\B(\#[a-z0-9_]+)\b/g;

        return text.replace(slugPattern, function(slug) {
            var s = slug.substring(1);
            var room = data.rooms.find(function(room) {
                return room.attributes.slug === s;
            });

            if (!room) {
                return slug;
            }

            return '<a href="#!/room/' + room.id + '">&#35;' + s + '</a>';
        });
    }

    function uploads(text) {
        var pattern = /^\s*(upload:\/\/[-A-Z0-9+&*@#\/%?=~_|!:,.;'"!()]*)\s*$/i;

        return text.replace(pattern, function(url) {
            return getBaseUrl() + url.substring(9);
        });
    }

    function embeds(text) {
        text = uploads(text);

        var imagePattern = /^\s*((https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;'"!()]*[-A-Z0-9+&@#\/%=~_|][.](jpe?g|png|gif))\s*$/i;

        if (!text.match(imagePattern)) {
            return false;
        }

        return text.replace(imagePattern, function(url) {
            var uri = encodeURI(_.unescape(url));
            return '<a class="thumbnail" href="' + uri +
                   '" target="_blank"><img src="' + uri +
                   '" alt="Pasted Image" /></a>';
        });
    }

    function emotes(text, data) {
        var regex = new RegExp('\\B(:[a-z0-9_\\+\\-]+:?)[\\b]?', 'ig');

        return text.replace(regex, function(group) {
            var key = group.split(':')[1];
            var emote = _.find(data.emotes, function(emote) {
                return emote.emote === key;
            });

            if (!emote) {
                return group;
            }

            var image = _.escape(emote.image),
                emo = _.escape(':' + emote.emote + ':'),
                size = _.escape(emote.size || 20);

            return '<img class="emote" src="' + image + '" title="' + emo + '" alt="' + emo + '" width="' + size + '" height="' + size + '" />';
        });
    }

    function replacements(text, data) {
        _.each(data.replacements, function(replacement) {
            text = text.replace(new RegExp(replacement.regex, 'ig'), replacement.template);
        });
        return text;
    }

    function markdown(text) {
        return markdownit.render(text);
    }

    exports.format = function(text, data) {
        var embed = embeds(text);
        if (embed) {
            return embed;
        }

        var pipeline = [
            markdown,
            mentions,
            roomLinks,
            emotes,
            replacements
        ];

        _.each(pipeline, function(func) {
            text = func(text, data);
        });

        return text;
    };

})(typeof exports === 'undefined' ? window.utils.message = {} : exports);
