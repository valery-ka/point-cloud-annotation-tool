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
    BatchView,
} from "components";

import { useServerLogs } from "hooks";

export const App = () => {
    useServerLogs();

    return (
        <div className="tool-3d-app">
            <LoadingOverlay />
            <BatchView />
            <FileNavigator />
            <div className="tool-3d-scene">
                <EditorContextMenu />
                <div className="tool-3d-container">
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
