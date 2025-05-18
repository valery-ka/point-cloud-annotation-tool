import { createContext, useContext, useState, useRef } from "react";

const EditorContext = createContext();

// РАБОТАЕТ - НЕ ТРОГАЙ
export const EditorProvider = ({ children }) => {
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

    const cameraControlsRef = useRef(null);
    const transformControlsRef = useRef(null);

    const isIntersectingMap = useRef(new Map());

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
                cameraControlsRef,
                transformControlsRef,
                isIntersectingMap,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => useContext(EditorContext);
