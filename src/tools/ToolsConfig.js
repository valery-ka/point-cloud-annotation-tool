export const getToolsConfig = (selectedTool, isDrawing) => {
    const config = {
        enabledButtons: {
            leftButton: true,
            rightButton: true,
        },
        enableZoom: true,
        enabledKeys: true,
    };

    switch (selectedTool) {
        case "brushTool":
            config.enabledButtons.leftButton = false;
            config.enabledButtons.rightButton = true;
            config.enableZoom = true;
            config.enabledKeys = true;
            break;
        case "polygonTool":
            config.enabledButtons.leftButton = false;
            config.enabledButtons.rightButton = !isDrawing;
            config.enableZoom = !isDrawing;
            config.enabledKeys = !isDrawing;
            break;
        case "lassoTool":
            config.enabledButtons.leftButton = false;
            config.enabledButtons.rightButton = true;
            config.enableZoom = true;
            config.enabledKeys = true;
            break;
        case "rectangleTool":
            config.enabledButtons.leftButton = false;
            config.enabledButtons.rightButton = true;
            config.enableZoom = true;
            config.enabledKeys = true;
            break;
        default:
            break;
    }

    return config;
};
