const path = require("path");

module.exports = {
    mode: "development",
    entry : {
        room : "./src/room.js",
        lobby: "./src/lobby.js"
    },
    output: {
        path: path.resolve(__dirname, 'dist/build'),
        filename: '[name].js'
    },
    watch: true
}