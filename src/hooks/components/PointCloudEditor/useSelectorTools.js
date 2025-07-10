import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";

import {
    useEditor,
    useFrames,
    useConfig,
    useFileManager,
    useEvent,
    useTools,
    useSettings,
    useHoveredPoint,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import { BrushTool, PolygonTool, LassoTool, RectangleTool, MODES } from "tools";

import * as APP_CONSTANTS from "constants";
import { updatePixelProjections } from "utils/editor";

const { DEFAULT_TOOL } = APP_CONSTANTS;

export const useSelectorTools = (
    paintSelectedPoints,
    filterSelectedPoints,
    handleSelectedPointsSize,
    requestSaveLabels,
) => {
    const { pcdFiles } = useFileManager();
    const { nonHiddenClasses } = useConfig();
    const { isPlaying, activeFrameIndex } = useFrames();
    const { subscribe, unsubscribe } = useEvent();
    const { pointCloudRefs, pointLabelsRef, selectedClassIndex, pixelProjections } = useEditor();
    const { selectedTool, setIsDrawing, selectionMode, setSelectionMode } = useTools();

    const { highlightedPoint } = useHoveredPoint();

    const { settings } = useSettings();

    const theme = useMemo(() => {
        return settings.general.theme;
    }, [settings.general.theme]);

    const paintDepth = useMemo(() => {
        return settings.editorSettings.editor.paintDepth;
    }, [settings.editorSettings.editor.paintDepth]);

    const toolClasses = {
        brushTool: BrushTool,
        polygonTool: PolygonTool,
        lassoTool: LassoTool,
        rectangleTool: RectangleTool,
    };

    const { gl, camera } = useThree();
    const { savedPolygonState, setSavedPolygonState } = useTools();

    const savePolygonState = useCallback(
        (polygon) => {
            setSavedPolygonState({
                glSize: {
                    width: gl.domElement.width,
                    height: gl.domElement.height,
                },
                camera: camera.clone(),
                polygon: polygon,
            });
        },
        [gl.domElement, camera],
    );

    const createCallbacks = useCallback(
        () => ({
            setIsDrawing,
            paintSelectedPoints,
            filterSelectedPoints,
            handleSelectedPointsSize,
            requestSaveLabels,
            savePolygonState,
        }),
        [
            setIsDrawing,
            paintSelectedPoints,
            filterSelectedPoints,
            handleSelectedPointsSize,
            requestSaveLabels,
            savePolygonState,
        ],
    );

    const getCloudData = useCallback(
        (frameIndex, pixelProjectionsOverride) => {
            const filePath = pcdFiles[frameIndex];
            const cloud = pointCloudRefs.current[filePath];
            const positions =
                cloud?.geometry?.attributes?.original?.array ??
                cloud?.geometry?.attributes?.position?.array;

            return {
                positions,
                labels: pointLabelsRef.current[filePath],
                pixelProjections: pixelProjectionsOverride || null,
            };
        },
        [pcdFiles],
    );

    const getSelectionData = useCallback(
        (themeOverride = theme) => ({
            theme: themeOverride,
            selectionMode,
            highlightedPoint,
            paintDepth,
            originalClassIndex: nonHiddenClasses[selectedClassIndex]?.originalIndex,
        }),
        [theme, selectionMode, highlightedPoint, paintDepth, nonHiddenClasses, selectedClassIndex],
    );

    const toolProps = useMemo(
        () => ({
            callbacks: createCallbacks(),
            selectionData: getSelectionData(),
            cloudData: getCloudData(activeFrameIndex, pixelProjections),
        }),
        [createCallbacks, getSelectionData, getCloudData, activeFrameIndex, pixelProjections],
    );

    const propagateLastPolygon = useCallback(() => {
        if (!savedPolygonState || typeof selectedClassIndex !== "number") return;
        const polygonTool = selectorToolsRefs.current["polygonTool"];

        const { glSize, camera, polygon } = savedPolygonState;
        const filePath = pcdFiles[activeFrameIndex];
        const cloud = pointCloudRefs.current[filePath];
        const positions = cloud?.geometry?.attributes?.original?.array;

        const pixelProjections = updatePixelProjections(positions, camera, glSize);
        const cloudData = getCloudData(activeFrameIndex, pixelProjections);
        const selectionData = getSelectionData("dark");
        const callbacks = createCallbacks();

        const polygonParams = {
            brushCenter: [0, 0],
            brushRadius: 0,
            isBrushTool: false,
            polygon,
        };

        polygonTool.updateProps({ cloudData, selectionData, callbacks });
        polygonTool.selectBySavedPolygon({ cloudData, selectionData, polygonParams });
    }, [
        savedPolygonState,
        selectedClassIndex,
        pcdFiles,
        activeFrameIndex,
        getCloudData,
        getSelectionData,
        createCallbacks,
    ]);

    useSubscribeFunction("propagateLastPolygon", propagateLastPolygon, []);

    const selectorToolsRefs = useRef(
        Object.keys(toolClasses).reduce((acc, toolName) => {
            acc[toolName] = null;
            return acc;
        }, {}),
    );

    // creating each tool
    // if tool is created, update it's props when deps are changed
    useEffect(() => {
        if (isPlaying) return;

        const toolInstance = selectorToolsRefs.current[selectedTool];

        Object.keys(selectorToolsRefs.current).forEach((toolName) => {
            if (!selectorToolsRefs.current[toolName]) {
                const ToolClass = toolClasses[toolName];
                if (ToolClass) {
                    selectorToolsRefs.current[toolName] = new ToolClass(toolProps);
                }
            }
        });

        if (selectedTool && toolInstance) {
            toolInstance.updateProps(toolProps);
        }
    }, [selectedTool, toolProps, isPlaying]);

    // it's important to clear pixel projections when active frame changed
    // to prevent keeping indices of previous frame
    useEffect(() => {
        Object.values(selectorToolsRefs.current).forEach((tool) => {
            if (tool) {
                tool.clearProjections();
            }
        });
    }, [activeFrameIndex]);

    // activation of selected tool
    // deactivation of previous selected tool
    const [prevTool, setPrevTool] = useState(null);

    useEffect(() => {
        if (prevTool && selectorToolsRefs.current[prevTool]) {
            selectorToolsRefs.current[prevTool].deactivate();
        }

        if (selectedTool !== DEFAULT_TOOL && selectorToolsRefs.current[selectedTool]) {
            selectorToolsRefs.current[selectedTool].activate();
        }

        setPrevTool(selectedTool);
    }, [selectedTool]);

    // restore previous selected mode when finish erase / force painting
    const selectionModeRef = useRef(selectionMode);
    const prevSelectionModeRef = useRef(selectionMode);

    const erase = "paintErase";
    const force = "paintForce";

    useEffect(() => {
        selectionModeRef.current = selectionMode;
    }, [selectionMode]);

    const handleKeyDown = useCallback((ev) => {
        if (ev.key === MODES[erase].hotkey && selectionModeRef.current !== erase) {
            prevSelectionModeRef.current = selectionModeRef.current;
            setSelectionMode(erase);
        } else if (ev.key === MODES[force].hotkey && selectionModeRef.current !== force) {
            prevSelectionModeRef.current = selectionModeRef.current;
            setSelectionMode(force);
        }
    }, []);

    const handleKeyUp = useCallback((ev) => {
        if (ev.key === MODES[erase].hotkey) {
            setSelectionMode(prevSelectionModeRef.current);
        } else if (ev.key === MODES[force].hotkey) {
            setSelectionMode(prevSelectionModeRef.current);
        }
    }, []);

    useEffect(() => {
        const selectionModes = Object.keys(MODES);

        const modeHandlers = selectionModes.reduce((handlers, mode) => {
            handlers[mode] = () => setSelectionMode(mode);
            return handlers;
        }, {});

        selectionModes.forEach((mode) => {
            const handler = modeHandlers[mode];
            if (handler) {
                subscribe(mode, handler);
            }
        });

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        return () => {
            selectionModes.forEach((mode) => {
                const handler = modeHandlers[mode];
                if (handler) {
                    unsubscribe(mode, handler);
                }
            });
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [subscribe, unsubscribe]);

    return selectorToolsRefs.current;
};
