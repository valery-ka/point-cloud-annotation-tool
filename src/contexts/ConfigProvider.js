import { createContext, useContext, useState, useEffect } from "react";

import { API_PATHS } from "@config/apiPaths";

const { CONFIG } = API_PATHS;

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        classes: null,
        moderation: null,
        objects: null,
    });
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [nonHiddenClasses, setNonHiddenClasses] = useState([]);

    useEffect(() => {
        const fetchConfig = async (endpoint) => {
            try {
                const response = await fetch(CONFIG(endpoint));
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                return await response.json();
            } catch (error) {
                console.error(`Loading error ${endpoint}:`, error);
                return null;
            }
        };

        const loadAllConfigs = async () => {
            const [classes, moderation, objects] = await Promise.all([
                fetchConfig("classes"),
                fetchConfig("moderation"),
                fetchConfig("objects"),
            ]);

            setConfig({ classes, moderation, objects });
            setIsConfigLoaded(true);
        };

        loadAllConfigs();
    }, []);

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
        <ConfigContext.Provider value={{ config, nonHiddenClasses, isConfigLoaded }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
