import { createContext, useContext, useRef, useState } from "react";

const CuboidsContext = createContext();

export const CuboidsProvider = ({ children }) => {
    const [cuboids, setCuboids] = useState([]);
    const cuboidsRef = useRef({});

    const [selectedCuboid, setSelectedCuboid] = useState(null);
    const selectedCuboidRef = useRef(null);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    const isCuboidTransformingRef = useRef(false);
    const sideViewsCamerasNeedUpdate = useRef(true);

    return (
        <CuboidsContext.Provider
            value={{
                cuboidsRef,
                selectedCuboidRef,
                sideViewsCamerasNeedUpdate,
                sideViews,
                setSideViews,
                handlePositions,
                setHandlePositions,
                cuboids,
                setCuboids,
                selectedCuboid,
                setSelectedCuboid,
                isCuboidTransformingRef,
            }}
        >
            {children}
        </CuboidsContext.Provider>
    );
};

export const useCuboids = () => useContext(CuboidsContext);
