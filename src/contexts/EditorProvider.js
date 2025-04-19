import { createContext, useContext, useState, useRef } from "react";

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
    const pointCloudRefs = useRef({});

    const [pendingSaveState, setPendingSaveState] = useState(false);
    const [selectedClassIndex, setSelectedClassIndex] = useState(null);
    const [pixelProjections, setPixelProjections] = useState(
        new Float32Array(), // [idx0, pixelX0, pixelY0, idx1, pixelX1, pixelY1, ...]
    );

    const classesVisibilityRef = useRef({});
    const minMaxZRef = useRef([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]);
    const [hasFilterSelectionPoint, setHasFilterSelectionPoint] = useState(false);

    const originalPositionsRef = useRef({});
    const activeFramePositionsRef = useRef([]);

    const pointLabelsRef = useRef({});
    const prevLabelsRef = useRef({});

    const undoStackRef = useRef({});
    const redoStackRef = useRef({});

    return (
        <EditorContext.Provider
            value={{
                selectedClassIndex,
                setSelectedClassIndex,
                pointCloudRefs,
                originalPositionsRef,
                activeFramePositionsRef,
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
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => useContext(EditorContext);
