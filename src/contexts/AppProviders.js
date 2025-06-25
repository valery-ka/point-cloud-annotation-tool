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
            <FramesProvider>
                <FileManagerProvider>
                    <ConfigProvider>
                        <ModerationProvider>{children}</ModerationProvider>
                    </ConfigProvider>
                </FileManagerProvider>
            </FramesProvider>
        </LoadingProvider>
    </EventProvider>
);

const PointCloudProvider = ({ children }) => (
    <EditorProvider>
        <ToolsProvider>
            <HoveredPointProvider>
                <CuboidsProvider>
                    <OdometryProvider>
                        <BatchProvider>{children}</BatchProvider>
                    </OdometryProvider>
                </CuboidsProvider>
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
