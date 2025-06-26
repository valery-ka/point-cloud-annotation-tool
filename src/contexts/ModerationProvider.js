import { createContext, useContext, useState, useEffect } from "react";

import { useFileManager } from "./FileManagerProvider";

import { API_PATHS } from "config/apiPaths";
import { useLoading } from "./LoadingProvider";

const { NAVIGATOR } = API_PATHS;

const ModerationContext = createContext();

export const ModerationProvider = ({ children }) => {
    const { folderName } = useFileManager();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();

    const [issues, setIssues] = useState([]);
    const [isIssuesHidden, setIsIssuesHidden] = useState(false);

    useEffect(() => {
        if (!folderName.length || !loadedData.odometry) return;

        const message = "loadingModeration";

        const onFinish = () => {
            setLoadingProgress({ message: "", progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                solution: {
                    ...prev.solution,
                    moderation: true,
                },
            }));
        };

        const fetchModerationData = async () => {
            setLoadingProgress({ message, progress: 0, isLoading: true });

            try {
                const response = await fetch(NAVIGATOR.SOLUTION.MODERATION(folderName));
                const data = await response.json();

                if (data.error) {
                    setIssues([]);
                } else {
                    setIssues(data);
                    onFinish();
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                onFinish();
            }
        };

        fetchModerationData();
    }, [folderName, loadedData.odometry]);

    return (
        <ModerationContext.Provider
            value={{
                issues,
                setIssues,
                isIssuesHidden,
                setIsIssuesHidden,
            }}
        >
            {children}
        </ModerationContext.Provider>
    );
};

export const useModeration = () => useContext(ModerationContext);
