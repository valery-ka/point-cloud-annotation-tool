import { createContext, useContext, useState, useEffect } from "react";

import { useLoading } from "contexts";

import * as APP_CONSTANTS from "constants";

const { DEFAULT_TOOL, DEFAULT_MODE } = APP_CONSTANTS;

const ToolsContext = createContext();

export const ToolsProvider = ({ children }) => {
    const [selectionMode, setSelectionMode] = useState(DEFAULT_MODE);
    const [selectedTool, setSelectedTool] = useState(DEFAULT_TOOL);
    const [isDrawing, setIsDrawing] = useState(false);

    const [savedPolygonState, setSavedPolygonState] = useState(null);

    const { isCleaningUp, setIsCleaningUp } = useLoading();

    useEffect(() => {
        if (!isCleaningUp.editor) return;

        setSelectionMode(DEFAULT_MODE);
        setSelectedTool(DEFAULT_TOOL);
        setIsDrawing(false);

        setSavedPolygonState(null);

        setIsCleaningUp((prev) => ({
            ...prev,
            tools: true,
        }));
    }, [isCleaningUp.editor]);

    return (
        <ToolsContext.Provider
            value={{
                selectionMode,
                setSelectionMode,
                selectedTool,
                setSelectedTool,
                isDrawing,
                setIsDrawing,
                savedPolygonState,
                setSavedPolygonState,
            }}
        >
            {children}
        </ToolsContext.Provider>
    );
};

export const useTools = () => useContext(ToolsContext);
