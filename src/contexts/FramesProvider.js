import { createContext, useContext, useState } from "react";

const FramesContext = createContext();

export const FramesProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);

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
