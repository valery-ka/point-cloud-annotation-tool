const { overrideDevServer } = require("customize-cra");

module.exports = {
    devServer: overrideDevServer((config) => {
        config.hot = false;
        config.liveReload = true;
        return config;
    }),
};
