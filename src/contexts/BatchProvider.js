import { createContext, useContext, useRef, useState, useEffect } from "react";

import { useLoading } from "contexts";

const BatchContext = createContext();

export const BatchProvider = ({ children }) => {
    const { isCleaningUp, setIsCleaningUp } = useLoading();

    const [batchMode, setBatchMode] = useState(false);
    const [currentFrame, setCurrentFrame] = useState([]);
    const [batchEditorCameras, setBatchEditorCameras] = useState({});
    const [batchHandlePositions, setBatchHandlePositions] = useState({});
    const [viewsCount, setViewsCount] = useState(5);
    const [activeCameraViews, setActiveCameraViews] = useState({
        top: true,
        left: true,
        front: true,
    });
    const selectedCuboidBatchGeometriesRef = useRef(null);
    const batchViewsCamerasNeedUpdateRef = useRef(true);
    const batchEditingFrameRef = useRef(null);
    const updateBatchCuboidRef = useRef({ needsUpdate: false, frame: null, id: null });

    useEffect(() => {
        if (!isCleaningUp.cuboids) return;
        setBatchMode(false);
        // setCurrentFrame([]);
        setBatchEditorCameras({});
        setBatchHandlePositions({});

        setViewsCount(5);
        setActiveCameraViews({
            top: true,
            left: true,
            front: true,
        });

        selectedCuboidBatchGeometriesRef.current = null;
        batchViewsCamerasNeedUpdateRef.current = true;
        batchEditingFrameRef.current = null;
        updateBatchCuboidRef.current = { needsUpdate: false, frame: null, id: null };

        setIsCleaningUp((prev) => ({
            ...prev,
            batch: true,
        }));
    }, [isCleaningUp.cuboids]);

    return (
        <BatchContext.Provider
            value={{
                batchMode,
                setBatchMode,
                currentFrame,
                setCurrentFrame,
                batchEditorCameras,
                setBatchEditorCameras,
                batchHandlePositions,
                setBatchHandlePositions,
                viewsCount,
                setViewsCount,
                activeCameraViews,
                setActiveCameraViews,
                selectedCuboidBatchGeometriesRef,
                batchViewsCamerasNeedUpdateRef,
                batchEditingFrameRef,
                updateBatchCuboidRef,
            }}
        >
            {children}
        </BatchContext.Provider>
    );
};

export const useBatch = () => useContext(BatchContext);
