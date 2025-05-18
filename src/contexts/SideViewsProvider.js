import { createContext, useContext, useRef, useState } from "react";

const SideViewsContext = createContext();

export const SideViewsProvider = ({ children }) => {
    const selectedCuboidRef = useRef(null);
    const sideViewsCamerasNeedUpdate = useRef(true);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    return (
        <SideViewsContext.Provider
            value={{
                selectedCuboidRef,
                sideViewsCamerasNeedUpdate,
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
