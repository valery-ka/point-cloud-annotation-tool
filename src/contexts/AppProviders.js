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
    CuboidsProvider,
    BatchProvider,
    OdometryProvider,
    LoadingProvider,
} from "contexts";

const DataProviders = ({ children }) => (
    <EventProvider>
        <LoadingProvider>
            <FileManagerProvider>
                <ConfigProvider>
                    <FramesProvider>
                        <ModerationProvider>{children}</ModerationProvider>
                    </FramesProvider>
                </ConfigProvider>
            </FileManagerProvider>
        </LoadingProvider>
    </EventProvider>
);

const PointCloudProvider = ({ children }) => (
    <EditorProvider>
        <ToolsProvider>
            <HoveredPointProvider>
                <OdometryProvider>
                    <CuboidsProvider>
                        <BatchProvider>{children}</BatchProvider>
                    </CuboidsProvider>
                </OdometryProvider>
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
