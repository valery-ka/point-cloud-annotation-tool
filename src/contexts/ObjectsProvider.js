import { createContext, useContext, useRef, useState } from "react";

const ObjectsContext = createContext();

export const ObjectsProvider = ({ children }) => {
    const [cuboids, setCuboids] = useState([]);
    const selectedCuboidRef = useRef(null);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});
    const sideViewsCamerasNeedUpdate = useRef(true);

    return (
        <ObjectsContext.Provider
            value={{
                selectedCuboidRef,
                sideViewsCamerasNeedUpdate,
                sideViews,
                setSideViews,
                handlePositions,
                setHandlePositions,
                cuboids,
                setCuboids,
            }}
        >
            {children}
        </ObjectsContext.Provider>
    );
};

export const useObjects = () => useContext(ObjectsContext);
