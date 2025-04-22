import { createContext, useContext, useState } from "react";

const HoveredPointContext = createContext();

export const HoveredPointProvider = ({ children }) => {
    const [highlightedPoint, setHighlightedPoint] = useState(null);

    return (
        <HoveredPointContext.Provider
            value={{
                highlightedPoint,
                setHighlightedPoint,
            }}
        >
            {children}
        </HoveredPointContext.Provider>
    );
};

export const useHoveredPoint = () => useContext(HoveredPointContext);
