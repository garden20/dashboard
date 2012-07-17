define([
    'exports',
    'require'
],
function (exports, require) {

    exports.imgToDataURI = function (src, callback) {
        var img = new Image();
        img.src = src;
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            return callback(null, canvas.toDataURL());
        };
        img.onerror = function () {
            return callback(new Error('Error loading image: ' + src));
        };
        img.onabort = function () {
            return callback(new Error('Loading of image aborted: ' + src));
        };
    };

});
