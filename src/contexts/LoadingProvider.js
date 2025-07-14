import { createContext, useContext, useState, useRef, useEffect } from "react";

// Порядок ключей по фактической последовательности загрузки
const INITIAL_LOADED_DATA = {
    config: false, // ConfigProvider.js
    calibrations: false, // useFetchCalibrations.js
    odometry: false, // useWorldShifting.js
    solution: {
        labels: false, // useLabelsLoader.js
        objects: false, // useObjectsLoader.js
        moderation: false, // ModerationProvider.js
    },
    pointclouds: false, // usePointCloudLoader.js
    images: false, // useImageLoader.js
    isLoadingRunning: false,
};

// Порядок ключей по последовательности контекстов в AppProviders.js
const INITIAL_CLEANING_DATA = {
    config: false, // ConfigProvider.js
    frames: false, // FramesProvider.js
    moderation: false, // ModerationProvider.js
    editor: false, // EditorProvider.js
    tools: false, // ToolsProvider.js
    hoveredPoint: false, // HoveredPointProvider.js
    odometry: false, // OdometryProvider.js
    cuboids: false, // CuboidsProvider.js
    batch: false, // BatchProvider.js
    calibrations: false, // CalibrationProvider.js
    images: false, // ImagesProvider.js
    isCleaningRunning: false,
};

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const topLoaderBarRef = useRef(null);

    const [globalIsLoading, setGlobalIsLoading] = useState(false);

    const [loadingProgress, setLoadingProgress] = useState({
        message: "",
        progress: 0,
        isLoading: false,
    });

    const [topLoaderLoadingProgress, setTopLoaderLoadingProgress] = useState({
        message: "",
        progress: 0,
        isLoading: false,
    });

    const [loadedData, setLoadedData] = useState(INITIAL_LOADED_DATA);
    const [isCleaningUp, setIsCleaningUp] = useState(INITIAL_CLEANING_DATA);

    useEffect(() => {
        if (Object.values(isCleaningUp).every(Boolean)) {
            setIsCleaningUp(INITIAL_CLEANING_DATA);
            setLoadedData({ ...INITIAL_LOADED_DATA, isLoadingRunning: true });
        }
    }, [isCleaningUp]);

    return (
        <LoadingContext.Provider
            value={{
                topLoaderBarRef,
                globalIsLoading,
                setGlobalIsLoading,
                loadingProgress,
                setLoadingProgress,
                topLoaderLoadingProgress,
                setTopLoaderLoadingProgress,
                loadedData,
                setLoadedData,
                isCleaningUp,
                setIsCleaningUp,
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
