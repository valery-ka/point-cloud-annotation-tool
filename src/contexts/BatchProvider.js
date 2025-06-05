import { createContext, useContext, useRef, useState } from "react";

const BatchContext = createContext();

export const BatchProvider = ({ children }) => {
    const [batchMode, setBatchMode] = useState(false);
    const [currentFrame, setCurrentFrame] = useState([]);
    const [batchEditorCameras, setBatchEditorCameras] = useState({});
    const [batchHandlePositions, setBatchHandlePositions] = useState({});
    const [viewsCount, setViewsCount] = useState(10);
    const [activeCameraViews, setActiveCameraViews] = useState({
        top: true,
        left: true,
        front: true,
    });
    const selectedCuboidBatchGeometriesRef = useRef(null);
    const batchViewsCamerasNeedUpdateRef = useRef(true);
    const batchEditingFrameRef = useRef(null);
    const updateBatchCuboidRef = useRef(false);

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
