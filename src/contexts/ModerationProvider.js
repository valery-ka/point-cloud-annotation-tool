import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { useLoading, useConfig, useFileManager } from "contexts";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

const ModerationContext = createContext();

export const ModerationProvider = ({ children }) => {
    const { folderName } = useFileManager();

    const { isModerationJob } = useConfig();

    const { isCleaningUp, setIsCleaningUp } = useLoading();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();

    const [issues, setIssues] = useState([]);
    const [isIssuesHidden, setIsIssuesHidden] = useState(false);

    const isIssueHidden = useCallback(
        (issue) => {
            return isIssuesHidden || (isModerationJob ? issue?.resolved : issue?.checked);
        },
        [isIssuesHidden, isModerationJob],
    );

    useEffect(() => {
        if (!folderName.length || !loadedData.odometry || !loadedData.isLoadingRunning) return;

        const message = "loadingModeration";

        const onFinish = () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
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
    }, [folderName, loadedData.odometry, loadedData.isLoadingRunning]);

    useEffect(() => {
        if (!isCleaningUp.frames) return;

        setIssues([]);
        setIsIssuesHidden(false);

        setIsCleaningUp((prev) => ({
            ...prev,
            moderation: true,
        }));
    }, [isCleaningUp.frames]);

    return (
        <ModerationContext.Provider
            value={{
                issues,
                setIssues,
                isIssueHidden,
                isIssuesHidden,
                setIsIssuesHidden,
            }}
        >
            {children}
        </ModerationContext.Provider>
    );
};

export const useModeration = () => useContext(ModerationContext);
