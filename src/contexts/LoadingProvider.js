import { createContext, useContext, useState, useRef } from "react";

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

    // Порядок ключей по фактической последовательности загрузки
    const [loadedData, setLoadedData] = useState({
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
    });

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
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
