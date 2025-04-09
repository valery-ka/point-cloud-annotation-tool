import { createContext, useContext, useState } from "react";

import { useMousetrapPause } from "@hooks";

const FramesContext = createContext();

export const FramesProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);
    const [areFramesLoading, setAreFramesLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    useMousetrapPause(areFramesLoading);

    return (
        <FramesContext.Provider
            value={{
                isPlaying,
                setIsPlaying,
                activeFrameIndex,
                setActiveFrameIndex,
                areFramesLoading,
                setAreFramesLoading,
                loadingProgress,
                setLoadingProgress,
            }}
        >
            {children}
        </FramesContext.Provider>
    );
};

export const useFrames = () => useContext(FramesContext);
