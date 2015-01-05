'use strict';

var basename = require('basename');
var gutil = require('gulp-util');
var stream = require('through2').obj;
var _messageformatBundle = require('messageformat-bundle');

var MessageformatBundleError = gutil.PluginError.bind(null, 'messageformat-bundle');


var self = function messageformatBundle (options) {
    // Determine options.
    if (!options) options = {};
    var parsing = options.parsing || JSON.parse;
    var localeString =
        ( typeof options.locale != 'undefined'
        ? '' + options.locale
        : undefined
        );
    var localeFunction =
        ( typeof options.locale == 'function'
        ? options.locale
        : self.locale.fromFilename
        );
    var customPlurals = options.customPlurals || undefined;
    var formatting = options.formatting || self.formatting.asModule;

    // Validate options.
    if (typeof parsing != 'function') throw new MessageformatBundleError
        ( 'If you provide `options.parsing`, it must be a function.'
        );
    if (customPlurals && typeof customPlurals != 'function') throw new MessageformatBundleError
        ( 'If you provide `options.customPlurals`, it must be a function.'
        );
    if (formatting && typeof formatting != 'function') throw new MessageformatBundleError
        ( 'If you provide `options.formatting`, it must be a function.'
        );

    // Construct the stream:
    return stream(function messageformatBundleStream (file, encoding, done) {
        var source, options;

        if (file.isBuffer()) {
            // If the streamed file is a buffer,
            source = parsing(file.contents.toString());

            options = {locale: localeString || localeFunction(file)};
            if (customPlurals) options.customPlurals = customPlurals;
            if (formatting) options.formatting = formatting;

            // …pass it through messageformat-bundle.
            try {
                file.contents = _messageformatBundle
                    ( source
                    , options
                    ).toBuffer();
                }
            catch (e) {
                return done(e);
                }
            file.path = gutil.replaceExtension(file.path, '.js');
            }

        else if (file.isStream()) return done(new MessageformatBundleError
            ( 'Streams not supported'
            ));

        this.push(file);
        return done();
        });
    };


self.locale =
    { fromFilename: function fromFilename (file) {
        return basename(file.path);
        }
    };


self.formatting = _messageformatBundle.formatting;


module.exports = self;
