import { createContext, useContext, useState, useEffect } from "react";

import { usePCDManager } from "./PCDManagerContext"

import { API_PATHS } from "@config/apiPaths";

const { MODERATION } = API_PATHS;

const ModerationContext = createContext();

export const ModerationProvider = ({ children }) => {
    const [issues, setIssues] = useState([]);
    const [isIssuesHidden, setIsIssuesHidden] = useState(false);
    const { folderName } = usePCDManager();

    useEffect(() => {
        if (!folderName.length) return;

        fetch(MODERATION(folderName))
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setIssues([]);
                } else {
                    setIssues(data);
                }
            })
            .catch(console.error);
    }, [folderName]);

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
