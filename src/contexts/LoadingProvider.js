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
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
