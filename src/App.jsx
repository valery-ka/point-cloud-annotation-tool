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
    CameraImages,
} from "components";
import { useFrames } from "contexts";

export const App = () => {
    const { arePointCloudsLoading, areImagesLoading } = useFrames();

    return (
        <div className="tool-3d-app">
            {/* тут на подумать */}
            {arePointCloudsLoading && <LoadingOverlay message="loadingFrames" />}
            {areImagesLoading && <LoadingOverlay message="loadingImages" />}
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
                    <CameraImages />
                </div>
                <Sidebar />
            </div>
            <FrameSwitcher />
        </div>
    );
};
