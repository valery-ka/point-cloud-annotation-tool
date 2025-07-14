import { createContext, useContext, useState, useEffect } from "react";

import { useLoading } from "contexts";

const HoveredPointContext = createContext();

export const HoveredPointProvider = ({ children }) => {
    const [highlightedPoint, setHighlightedPoint] = useState(null);

    const { isCleaningUp, setIsCleaningUp } = useLoading();

    useEffect(() => {
        if (!isCleaningUp.tools) return;

        setHighlightedPoint(null);

        setIsCleaningUp((prev) => ({
            ...prev,
            hoveredPoint: true,
        }));
    }, [isCleaningUp.tools]);

    return (
        <HoveredPointContext.Provider value={{ highlightedPoint, setHighlightedPoint }}>
            {children}
        </HoveredPointContext.Provider>
    );
};

export const useHoveredPoint = () => useContext(HoveredPointContext);
