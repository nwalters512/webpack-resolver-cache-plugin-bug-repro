const WebpackDedupePlugin = require('./dedupe-plugin').default;
module.exports = {
    resolve: {
        extensions: ['.browser.js', '.js'],
        plugins: [new WebpackDedupePlugin()],
    },
};