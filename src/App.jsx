import React from "react";
import { Canvas } from "@react-three/fiber";
import {
    PointCloudEditor,
    EditorSideLeftControls,
    EditorTopLeftControls,
    EditorTopRightControls,
    FileNavigator,
    FrameSwitcher,
    Sidebar,
    LoadingOverlay,
    ContextMenu,
} from "components";
import { useFrames } from "contexts";

export const App = () => {
    const { areFramesLoading } = useFrames();

    return (
        <div className="tool-3d-app">
            {areFramesLoading && <LoadingOverlay message="loadingFrames" />}
            <FileNavigator />
            <div className="tool-3d-scene">
                <div className="tool-3d-container">
                    <ContextMenu />
                    <canvas id="canvasSelection" className="tool-3d-canvas-selection"></canvas>
                    <Canvas>
                        <PointCloudEditor />
                    </Canvas>
                    <EditorTopLeftControls />
                    <EditorSideLeftControls />
                    <EditorTopRightControls />
                </div>
                <Sidebar />
            </div>
            <FrameSwitcher />
        </div>
    );
};
