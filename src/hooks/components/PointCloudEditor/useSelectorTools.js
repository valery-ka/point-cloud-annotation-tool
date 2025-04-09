import { useRef, useMemo, useCallback, useState, useEffect } from "react";

import {
    useEditor,
    useFrames,
    useConfig,
    usePCDManager,
    useEvent,
    useTools,
    useSettings,
    useHoveredPoint,
} from "@contexts";
import { useSubscribeFunction } from "@hooks";

import {
    BrushTool,
    PolygonTool,
    LassoTool,
    RectangleTool,
    MODES,
} from "@tools";
import * as APP_CONSTANTS from "@constants";

const { DEFAULT_TOOL } = APP_CONSTANTS;

export const useSelectorTools = (
    paintSelectedPoints,
    filterSelectedPoints,
    handleSelectedPointsSize,
    requestSaveFrame
) => {
    const { pcdFiles } = usePCDManager();
    const { nonHiddenClasses } = useConfig();
    const { isPlaying, activeFrameIndex } = useFrames();
    const { subscribe, unsubscribe } = useEvent();
    const {
        pointLabelsRef,
        activeFramePositionsRef,
        selectedClassIndex,
        pixelProjections,
    } = useEditor();
    const { selectedTool, setIsDrawing, selectionMode, setSelectionMode } =
        useTools();

    const { highlightedPoint } = useHoveredPoint();

    const { settings } = useSettings();
    const paintDepth = useRef(settings.editorSettings.editor.paintDepth);

    const updatePaintDepth = useCallback((data) => {
        if (data) {
            const value = data.value;
            paintDepth.current = value;
        }
    }, []);

    useSubscribeFunction("paintDepth", updatePaintDepth, []);

    const toolClasses = {
        brushTool: BrushTool,
        polygonTool: PolygonTool,
        lassoTool: LassoTool,
        rectangleTool: RectangleTool,
    };

    const toolProps = useMemo(
        () => ({
            actions: {
                setIsDrawing,
                paintSelectedPoints,
                filterSelectedPoints,
                handleSelectedPointsSize,
                requestSaveFrame,
            },
            selection: {
                selectionMode,
                highlightedPoint,
                paintDepth: paintDepth.current,
            },
            frameData: {
                activeFrameIndex,
                pixelProjections,
                positions: activeFramePositionsRef,
                activeLabels:
                    pointLabelsRef.current[pcdFiles[activeFrameIndex]],
            },
            classData: {
                originalClassIndex:
                    nonHiddenClasses[selectedClassIndex]?.originalIndex,
            },
        }),
        [
            setIsDrawing,
            pixelProjections,
            highlightedPoint,
            activeFrameIndex,
            selectedClassIndex,
            selectionMode,
        ]
    );

    const selectorToolsRefs = useRef(
        Object.keys(toolClasses).reduce((acc, toolName) => {
            acc[toolName] = null;
            return acc;
        }, {})
    );

    const [prevTool, setPrevTool] = useState(null);

    // creating each tool
    // if tool is created, update it's props when deps are changed
    useEffect(() => {
        if (isPlaying) return;

        const toolInstance = selectorToolsRefs.current[selectedTool];

        Object.keys(selectorToolsRefs.current).forEach((toolName) => {
            if (!selectorToolsRefs.current[toolName]) {
                const ToolClass = toolClasses[toolName];
                if (ToolClass) {
                    selectorToolsRefs.current[toolName] = new ToolClass(
                        toolProps
                    );
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
    useEffect(() => {
        if (prevTool && selectorToolsRefs.current[prevTool]) {
            selectorToolsRefs.current[prevTool].deactivate();
        }

        if (
            selectedTool !== DEFAULT_TOOL &&
            selectorToolsRefs.current[selectedTool]
        ) {
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
        if (
            ev.key === MODES[erase].hotkey &&
            selectionModeRef.current !== erase
        ) {
            prevSelectionModeRef.current = selectionModeRef.current;
            setSelectionMode(erase);
        } else if (
            ev.key === MODES[force].hotkey &&
            selectionModeRef.current !== force
        ) {
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
