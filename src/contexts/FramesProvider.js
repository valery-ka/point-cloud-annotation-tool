import { createContext, useContext, useState, useEffect } from "react";

import { useLoading } from "contexts";

const FramesContext = createContext();

export const FramesProvider = ({ children }) => {
    const { isCleaningUp, setIsCleaningUp } = useLoading();

    const [isPlaying, setIsPlaying] = useState(false);
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);

    useEffect(() => {
        if (!isCleaningUp.config) return;

        setIsPlaying(false);
        setActiveFrameIndex(0);

        setIsCleaningUp((prev) => ({
            ...prev,
            frames: true,
        }));
    }, [isCleaningUp.config]);

    return (
        <FramesContext.Provider
            value={{
                isPlaying,
                setIsPlaying,
                activeFrameIndex,
                setActiveFrameIndex,
            }}
        >
            {children}
        </FramesContext.Provider>
    );
};

export const useFrames = () => useContext(FramesContext);
