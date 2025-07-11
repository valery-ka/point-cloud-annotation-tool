import { createContext, useContext, useState, useEffect, useMemo } from "react";

import { useFileManager, useLoading } from "contexts";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({});
    const [nonHiddenClasses, setNonHiddenClasses] = useState([]);

    const { folderName } = useFileManager();
    const { setLoadedData, setLoadingProgress } = useLoading();

    const isModerationJob = useMemo(() => {
        return config?.job?.type === "moderation" ?? false;
    }, [config]);

    const isDetectionTask = useMemo(() => {
        return config?.job?.detection_task ?? true;
    }, [config]);

    const isSemanticSegmentationTask = useMemo(() => {
        return config?.job?.semantic_segmentation_task ?? true;
    }, [config]);

    const isInstanceSegmentationTask = useMemo(() => {
        return config?.job?.instance_segmentation_task ?? false;
    }, [config]);

    useEffect(() => {
        if (!folderName.length) return;
        const message = "loadingConfig";

        const fetchConfig = async (endpoint, configName) => {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error(`Loading error for ${configName}:`, error);
                return [];
            }
        };

        const onFinish = () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                config: true,
            }));
        };

        const loadAllConfigs = async () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: true });

            const configKeys = Object.keys(NAVIGATOR.CONFIG);
            const totalConfigs = configKeys.length;

            const configEntries = [];
            let loadedCount = 0;

            for (const [key, pathFn] of Object.entries(NAVIGATOR.CONFIG)) {
                const data = await fetchConfig(pathFn(folderName), key);
                configEntries.push([key.toLowerCase(), data]);

                loadedCount++;
                const progress = loadedCount / totalConfigs;

                setLoadingProgress({
                    message: message,
                    progress: progress,
                    isLoading: true,
                });
            }

            const config = Object.fromEntries(configEntries);

            setConfig(config);
            onFinish();
        };

        loadAllConfigs();
    }, [folderName]);

    useEffect(() => {
        if (config?.classes) {
            const filteredClasses = config.classes
                .map((cls, index) => ({
                    ...cls,
                    originalIndex: index,
                }))
                .filter((cls) => !cls.hidden);
            setNonHiddenClasses(isSemanticSegmentationTask ? filteredClasses : []);
        }
    }, [config, isSemanticSegmentationTask]);

    return (
        <ConfigContext.Provider
            value={{
                config,
                nonHiddenClasses,
                isModerationJob,
                isDetectionTask,
                isSemanticSegmentationTask,
                isInstanceSegmentationTask,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
