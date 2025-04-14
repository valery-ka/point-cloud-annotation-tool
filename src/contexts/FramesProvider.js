import { createContext, useContext, useState } from "react";

import { useMousetrapPause } from "hooks";

const FramesContext = createContext();

export const FramesProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);
    const [arePointCloudsLoading, setArePointCloudsLoading] = useState(false);
    const [areImagesLoading, setAreImagesLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    useMousetrapPause(arePointCloudsLoading);

    return (
        <FramesContext.Provider
            value={{
                isPlaying,
                setIsPlaying,
                activeFrameIndex,
                setActiveFrameIndex,
                arePointCloudsLoading,
                setArePointCloudsLoading,
                areImagesLoading,
                setAreImagesLoading,
                loadingProgress,
                setLoadingProgress,
            }}
        >
            {children}
        </FramesContext.Provider>
    );
};

export const useFrames = () => useContext(FramesContext);
