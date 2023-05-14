const path = require("path");

module.exports = {
    mode: "development",
    entry : {
        room : "./src/room.js",
    },
    output: {
        path: path.resolve(__dirname, 'dist/build'),
        filename: '[name].js'
    },
    watch: true
}