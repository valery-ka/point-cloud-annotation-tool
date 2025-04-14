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
