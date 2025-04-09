import { createContext, useContext, useState } from "react";
import * as APP_CONSTANTS from "@constants";

const { DEFAULT_TOOL, DEFAULT_MODE } = APP_CONSTANTS;

const ToolsContext = createContext();

export const ToolsProvider = ({ children }) => {
    const [selectionMode, setSelectionMode] = useState(DEFAULT_MODE);
    const [selectedTool, setSelectedTool] = useState(DEFAULT_TOOL);
    const [isDrawing, setIsDrawing] = useState(false);

    return (
        <ToolsContext.Provider
            value={{
                selectionMode,
                setSelectionMode,
                selectedTool,
                setSelectedTool,
                isDrawing,
                setIsDrawing,
            }}
        >
            {children}
        </ToolsContext.Provider>
    );
};

export const useTools = () => useContext(ToolsContext);
