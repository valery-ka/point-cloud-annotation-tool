const path = require("path");

module.exports = function override(config, env) {
    config.resolve.alias = {
        ...config.resolve.alias,
        "@components": path.resolve(__dirname, "src/components/"),
        "@contexts": path.resolve(__dirname, "src/contexts/"),
        "@config": path.resolve(__dirname, "src/config/"),
        "@hooks": path.resolve(__dirname, "src/hooks/"),
        "@store": path.resolve(__dirname, "src/store/"),
        "@shaders": path.resolve(__dirname, "src/shaders/"),
        "@tools": path.resolve(__dirname, "src/tools/"),
        "@utils": path.resolve(__dirname, "src/utils/"),
        "@workers": path.resolve(__dirname, "src/workers/"),
        "@constants": path.resolve(__dirname, "src/constants.js"),
    };

    if (env === "production") {
        config.devtool = false;
    }

    return config;
};
