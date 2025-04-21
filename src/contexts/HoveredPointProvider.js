import { createContext, useContext, useState } from "react";
import * as APP_CONSTANTS from "constants";

const { DEFAULT_SEARCH_RADIUS } = APP_CONSTANTS;

const HoveredPointContext = createContext();

export const HoveredPointProvider = ({ children }) => {
    const [highlightedPoint, setHighlightedPoint] = useState(null);
    const [searcingRadius, setSearcingRadius] = useState(DEFAULT_SEARCH_RADIUS);

    return (
        <HoveredPointContext.Provider
            value={{
                highlightedPoint,
                setHighlightedPoint,
                searcingRadius,
                setSearcingRadius,
            }}
        >
            {children}
        </HoveredPointContext.Provider>
    );
};

export const useHoveredPoint = () => useContext(HoveredPointContext);
