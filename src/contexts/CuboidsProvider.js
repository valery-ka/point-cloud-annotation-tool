import { createContext, useContext, useRef, useState } from "react";
import { INITIAL_SIDE_VIEWS_ZOOM } from "constants";

const CuboidsContext = createContext();

const TEMP_ZOOM = 0.5;

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
    batch_top: TEMP_ZOOM,
    batch_left: TEMP_ZOOM,
    batch_front: TEMP_ZOOM,
};

export const CuboidsProvider = ({ children }) => {
    const cuboidsGeometriesRef = useRef({});
    const selectedCuboidGeometryRef = useRef(null);
    const selectedCuboidInfoRef = useRef(DEFAULT_INFO_CARD);

    const [cuboids, setCuboids] = useState([]);
    const [selectedCuboid, setSelectedCuboid] = useState(null);
    const [frameMarkers, setFrameMarkers] = useState([[], []]); // [0] - keyframes, [1] - visibility
    const [hoveredCuboid, setHoveredCuboid] = useState(null);

    const [sideViews, setSideViews] = useState([]);
    const [handlePositions, setHandlePositions] = useState({});

    // все, что с батчем в отдельный хук / контекст мб вынести?...
    const [batchMode, setBatchMode] = useState(false);
    const [currentFrame, setCurrentFrame] = useState([]);
    const [batchEditorCameras, setBatchEditorCameras] = useState({});
    const [batchHandlePositions, setBatchHandlePositions] = useState({});
    const [viewsCount, setViewsCount] = useState(10);
    const [activeCameraViews, setActiveCameraViews] = useState({
        top: true,
        left: true,
        front: true,
    });

    const selectedCuboidBatchGeometriesRef = useRef(null);
    const batchViewsCamerasNeedUpdateRef = useRef(true);
    const batchEditingFrameRef = useRef(null);

    const isCuboidTransformingRef = useRef(false);
    const sideViewCameraZoomsRef = useRef(DEFAULT_ZOOM);
    const sideViewsCamerasNeedUpdateRef = useRef(true);
    const cuboidColorsUpdateRef = useRef(false);

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
                frameMarkers,
                setFrameMarkers,
                batchMode,
                setBatchMode,
                batchEditorCameras,
                setBatchEditorCameras,
                sideViewCameraZoomsRef,
                selectedCuboidBatchGeometriesRef,
                batchHandlePositions,
                setBatchHandlePositions,
                batchViewsCamerasNeedUpdateRef,
                batchEditingFrameRef,
                currentFrame,
                setCurrentFrame,
                viewsCount,
                setViewsCount,
                activeCameraViews,
                setActiveCameraViews,
                cuboidColorsUpdateRef,
            }}
        >
            {children}
        </CuboidsContext.Provider>
    );
};

export const useCuboids = () => useContext(CuboidsContext);
