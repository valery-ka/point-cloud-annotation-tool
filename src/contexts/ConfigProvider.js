import { createContext, useContext, useState, useEffect, useMemo } from "react";

import { useFileManager } from "./FileManagerProvider";

import { API_PATHS } from "config/apiPaths";

const { CONFIG } = API_PATHS;

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        classes: null,
        moderation: null,
        objects: null,
    });
    const [nonHiddenClasses, setNonHiddenClasses] = useState([]);
    const { folderName } = useFileManager();

    const isModerationJob = useMemo(() => {
        return config?.job?.type === "moderation";
    }, [config]);

    useEffect(() => {
        if (!folderName.length) return;

        const fetchConfig = async (endpoint) => {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                return await response.json();
            } catch (error) {
                console.error(`Loading error ${endpoint}:`, error);
                return [];
            }
        };

        const loadAllConfigs = async () => {
            const configEntries = await Promise.all(
                Object.entries(CONFIG).map(async ([key, pathFn]) => {
                    const data = await fetchConfig(pathFn(folderName));
                    return [key.toLowerCase(), data];
                }),
            );

            const config = Object.fromEntries(configEntries);
            setConfig(config);
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

            setNonHiddenClasses(filteredClasses);
        }
    }, [config]);

    return (
        <ConfigContext.Provider value={{ config, nonHiddenClasses, isModerationJob }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
