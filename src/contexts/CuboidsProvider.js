import { createContext, useContext, useRef, useState } from "react";
import { INITIAL_SIDE_VIEWS_ZOOM, DEFAULT_TRANSFORM_MODE } from "constants";

const CuboidsContext = createContext();

const DEFAULT_INFO_CARD = {
    position: [0, 0, 0],
    scale: [0, 0, 0],
    rotation: [0, 0, 0],
    insidePointsCount: 0,
    selected: false,
};

const DEFAULT_ZOOM = {
    top: INITIAL_SIDE_VIEWS_ZOOM,
    left: INITIAL_SIDE_VIEWS_ZOOM,
    front: INITIAL_SIDE_VIEWS_ZOOM,
    batch_top: INITIAL_SIDE_VIEWS_ZOOM,
    batch_left: INITIAL_SIDE_VIEWS_ZOOM,
    batch_front: INITIAL_SIDE_VIEWS_ZOOM,
};

export const CuboidsProvider = ({ children }) => {
    const cuboidsGeometriesRef = useRef({});

    const deletedCuboidsRef = useRef([]);
    const [deletedObjects, setDeletedObjects] = useState([]);

    const selectedCuboidGeometryRef = useRef(null);
    const selectedCuboidInfoRef = useRef(DEFAULT_INFO_CARD);

    const copiedPSRRef = useRef(null);

    const [cuboids, setCuboids] = useState([]);
    const [selectedCuboid, setSelectedCuboid] = useState(null);
    const [frameMarkers, setFrameMarkers] = useState([[], []]); // [0] - keyframes, [1] - visibility
    const [hoveredCuboid, setHoveredCuboid] = useState(null);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    const [transformMode, setTransformMode] = useState(DEFAULT_TRANSFORM_MODE);
    const isCuboidTransformingRef = useRef(false);
    const sideViewCameraZoomsRef = useRef(DEFAULT_ZOOM);
    const sideViewsCamerasNeedUpdateRef = useRef(true);

    const cuboidsSolutionRef = useRef([]);
    const prevCuboidsRef = useRef([]);
    const cuboidEditingFrameRef = useRef(null);

    const cuboidsVisibilityRef = useRef({});
    const cuboidIdToLabelRef = useRef({});
    const pointsInsideCuboidsRef = useRef({});

    const updateSingleCuboidRef = useRef({ needsUpdate: false, frame: null, id: null });
    const updateProjectedCuboidsRef = useRef(false);

    return (
        <CuboidsContext.Provider
            value={{
                cuboidsGeometriesRef,
                selectedCuboidGeometryRef,
                selectedCuboidInfoRef,
                cuboids,
                setCuboids,
                selectedCuboid,
                setSelectedCuboid,
                frameMarkers,
                setFrameMarkers,
                hoveredCuboid,
                setHoveredCuboid,
                sideViews,
                setSideViews,
                handlePositions,
                setHandlePositions,
                isCuboidTransformingRef,
                sideViewCameraZoomsRef,
                sideViewsCamerasNeedUpdateRef,
                cuboidsSolutionRef,
                pointsInsideCuboidsRef,
                cuboidIdToLabelRef,
                updateSingleCuboidRef,
                prevCuboidsRef,
                cuboidEditingFrameRef,
                deletedCuboidsRef,
                deletedObjects,
                setDeletedObjects,
                cuboidsVisibilityRef,
                copiedPSRRef,
                transformMode,
                setTransformMode,
                updateProjectedCuboidsRef,
            }}
        >
            {children}
        </CuboidsContext.Provider>
    );
};

export const useCuboids = () => useContext(CuboidsContext);
