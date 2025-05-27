import { Canvas } from "@react-three/fiber";
import {
    PointCloudEditor,
    EditorControls,
    FileNavigator,
    FrameSwitcher,
    Sidebar,
    LoadingOverlay,
    EditorContextMenu,
    CameraImages,
    PointHighlighter,
    SideViews,
} from "components";

import { useServerLogs } from "hooks";

export const App = () => {
    useServerLogs();

    return (
        <div className="tool-3d-app">
            <LoadingOverlay />
            <FileNavigator />
            <div className="tool-3d-scene">
                <div className="tool-3d-container">
                    <EditorContextMenu />
                    <canvas id="canvasSelection" className="tool-3d-canvas-selection"></canvas>
                    <Canvas>
                        <PointCloudEditor />
                    </Canvas>
                    <EditorControls />
                    <CameraImages />
                    <PointHighlighter />
                </div>
                <SideViews />
                <Sidebar />
            </div>
            <FrameSwitcher />
        </div>
    );
};
