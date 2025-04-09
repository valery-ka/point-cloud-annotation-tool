import React from "react";
import {
    ConfigProvider,
    EventProvider,
    FramesProvider,
    PCDManagerProvider,
    HoveredPointProvider,
    SettingsProvider,
    EditorProvider,
    ToolsProvider,
    ModerationProvider,
} from "@contexts";

const DataProviders = ({ children }) => (
    <EventProvider>
        <ConfigProvider>
            <FramesProvider>
                <PCDManagerProvider>
                    <ModerationProvider>{children}</ModerationProvider>
                </PCDManagerProvider>
            </FramesProvider>
        </ConfigProvider>
    </EventProvider>
);

const UIProviders = ({ children }) => (
    <EditorProvider>
        <ToolsProvider>
            <HoveredPointProvider>
                <SettingsProvider>{children}</SettingsProvider>
            </HoveredPointProvider>
        </ToolsProvider>
    </EditorProvider>
);

export const AppProviders = ({ children }) => {
    return (
        <DataProviders>
            <UIProviders>{children}</UIProviders>
        </DataProviders>
    );
};
