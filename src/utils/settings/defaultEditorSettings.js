export const defaultEditorSettings = {
    navigation: {
        zoomSpeed: 5.0,
        keyPanSpeed: 15.0,
    },
    colors: {
        pointBrightness: 0.25,
        pointIntensity: 1.0,
        cuboidPointsMixFactor: 0.5,
    },
    sizes: {
        generalPointSize: 1.5,
        selectedClassSize: 1.0,
        highlightedPointSize: 3.0,
    },
    editor: {
        paintDepth: 0.03,
    },
    images: {
        cameraPositions: true,
        visibleVOID: false,
        generalPointSize: 1.0,
        selectedClassSize: 1.0,
        highlightedPointSize: 2.0,
        distortionThreshold: 350,
    },
    highlighter: {
        enabled: true,
        highlighterSize: 200,
        highlighterZoom: 1.0,
        generalPointSize: 0.3,
        highlightedPointSize: 1.0,
        searchingRadius: 1.0,
    },
    performance: {
        statsPanelEnabled: false,
        autoSaveTimerEnabled: false,
        autoSaveTimer: 30,
        imageFPS: 165,
        highlighterFPS: 165,
    },
};
