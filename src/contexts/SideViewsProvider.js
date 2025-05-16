import { createContext, useContext, useRef, useState } from "react";

const SideViewsContext = createContext();

export const SideViewsProvider = ({ children }) => {
    const selectedCuboidRef = useRef(null);
    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    return (
        <SideViewsContext.Provider
            value={{
                selectedCuboidRef,
                sideViews,
                setSideViews,
                handlePositions,
                setHandlePositions,
            }}
        >
            {children}
        </SideViewsContext.Provider>
    );
};

export const useSideViews = () => useContext(SideViewsContext);
