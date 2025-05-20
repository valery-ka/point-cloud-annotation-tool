import React from "react";
import {
    ConfigProvider,
    EventProvider,
    FramesProvider,
    FileManagerProvider,
    HoveredPointProvider,
    SettingsProvider,
    EditorProvider,
    ToolsProvider,
    ModerationProvider,
    ImagesProvider,
    CalibrationsProvider,
    ObjectsProvider,
} from "contexts";

const DataProviders = ({ children }) => (
    <EventProvider>
        <FramesProvider>
            <FileManagerProvider>
                <ConfigProvider>
                    <ModerationProvider>{children}</ModerationProvider>
                </ConfigProvider>
            </FileManagerProvider>
        </FramesProvider>
    </EventProvider>
);

const PointCloudProvider = ({ children }) => (
    <EditorProvider>
        <ToolsProvider>
            <HoveredPointProvider>
                <ObjectsProvider>{children}</ObjectsProvider>
            </HoveredPointProvider>
        </ToolsProvider>
    </EditorProvider>
);

const ImageProvider = ({ children }) => (
    <CalibrationsProvider>
        <ImagesProvider>{children}</ImagesProvider>
    </CalibrationsProvider>
);

export const AppProviders = ({ children }) => {
    return (
        <DataProviders>
            <PointCloudProvider>
                <ImageProvider>
                    <SettingsProvider>{children}</SettingsProvider>
                </ImageProvider>
            </PointCloudProvider>
        </DataProviders>
    );
};
