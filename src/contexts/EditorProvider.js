import { createContext, useContext, useState, useRef, useEffect } from "react";

import { useLoading } from "contexts";

const EditorContext = createContext();

// РАБОТАЕТ - НЕ ТРОГАЙ
export const EditorProvider = ({ children }) => {
    const { isCleaningUp, setIsCleaningUp } = useLoading();

    const pointCloudRefs = useRef({});

    const [pendingSaveState, setPendingSaveState] = useState(false);
    const [selectedClassIndex, setSelectedClassIndex] = useState(null);
    const [pixelProjections, setPixelProjections] = useState(
        new Float32Array(), // [idx0, pixelX0, pixelY0, idx1, pixelX1, pixelY1, ...]
    );

    const minMaxZRef = useRef([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]);
    const classesVisibilityRef = useRef({});
    const [hasFilterSelectionPoint, setHasFilterSelectionPoint] = useState(false);

    const pointLabelsRef = useRef({});
    const prevLabelsRef = useRef({});

    const undoStackRef = useRef({});
    const redoStackRef = useRef({});

    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const cameraControlsRef = useRef(null);
    const transformControlsRef = useRef(null);

    const isIntersectingMap = useRef(new Map());

    const cloudPointsColorNeedsUpdateRef = useRef(false);

    useEffect(() => {
        if (!isCleaningUp.moderation) return;

        pointCloudRefs.current = {};

        setPendingSaveState(false);
        setSelectedClassIndex(null);
        setPixelProjections(new Float32Array());

        classesVisibilityRef.current = {};
        setHasFilterSelectionPoint(false);

        pointLabelsRef.current = {};
        prevLabelsRef.current = {};

        undoStackRef.current = {};
        redoStackRef.current = {};

        isIntersectingMap.current = new Map();

        cloudPointsColorNeedsUpdateRef.current = false;

        setIsCleaningUp((prev) => ({
            ...prev,
            editor: true,
        }));
    }, [isCleaningUp.moderation]);

    return (
        <EditorContext.Provider
            value={{
                selectedClassIndex,
                setSelectedClassIndex,
                pointCloudRefs,
                pointLabelsRef,
                prevLabelsRef,
                pixelProjections,
                setPixelProjections,
                undoStackRef,
                redoStackRef,
                classesVisibilityRef,
                minMaxZRef,
                hasFilterSelectionPoint,
                setHasFilterSelectionPoint,
                pendingSaveState,
                setPendingSaveState,
                cameraRef,
                cameraControlsRef,
                transformControlsRef,
                isIntersectingMap,
                sceneRef,
                cloudPointsColorNeedsUpdateRef,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => useContext(EditorContext);
