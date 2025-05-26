import { createContext, useContext, useRef, useState } from "react";

const CuboidsContext = createContext();

const DEFAULT_INFO_CARD = {
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0],
    insidePointsCount: 0,
    selected: false,
};

export const CuboidsProvider = ({ children }) => {
    const cuboidsGeometriesRef = useRef({});
    const selectedCuboidGeometryRef = useRef(null);
    const selectedCuboidInfoRef = useRef(DEFAULT_INFO_CARD);

    const [cuboids, setCuboids] = useState([]);
    const [selectedCuboid, setSelectedCuboid] = useState(null);
    const [hoveredCuboid, setHoveredCuboid] = useState(null);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    const isCuboidTransformingRef = useRef(false);
    const sideViewsCamerasNeedUpdateRef = useRef(true);

    const cuboidsSolutionRef = useRef({});

    return (
        <CuboidsContext.Provider
            value={{
                cuboidsGeometriesRef,
                selectedCuboidGeometryRef,
                sideViewsCamerasNeedUpdateRef,
                selectedCuboidInfoRef,
                sideViews,
                setSideViews,
                handlePositions,
                setHandlePositions,
                cuboids,
                setCuboids,
                selectedCuboid,
                setSelectedCuboid,
                isCuboidTransformingRef,
                hoveredCuboid,
                setHoveredCuboid,
                cuboidsSolutionRef,
            }}
        >
            {children}
        </CuboidsContext.Provider>
    );
};

export const useCuboids = () => useContext(CuboidsContext);
