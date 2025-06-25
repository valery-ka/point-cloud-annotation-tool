import { useEffect, useCallback } from "react";

import { useFileManager, useEditor, useFrames, useEvent, useCuboids, useLoading } from "contexts";
import { useSubscribeFunction, useCuboidInterpolation } from "hooks";

export const useUndoRedo = (requestSaveLabels, onUndoRedo) => {
    const { publish } = useEvent();

    const { pcdFiles } = useFileManager();
    const { pointLabelsRef, undoStackRef, redoStackRef } = useEditor();
    const { isPlaying, activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();

    const { cuboidsSolutionRef, updateSingleCuboidRef } = useCuboids();

    const { saveCurrentPSR, interpolatePSR, findFrameMarkers, updateCuboidPSR } =
        useCuboidInterpolation();

    const updateUndoRedoState = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath] || [];
        const redoStack = redoStackRef.current[activeFrameFilePath] || [];

        publish(undoStack.length ? "enableUndo" : "disableUndo");
        publish(redoStack.length ? "enableRedo" : "disableRedo");
    }, [onUndoRedo, globalIsLoading, publish]);

    useSubscribeFunction("updateUndoRedoState", updateUndoRedoState, []);

    const undoAction = useCallback(() => {
        if (!pcdFiles.length || globalIsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath];

        if (!undoStack || undoStack.length === 0) return;

        const lastState = undoStack[undoStack.length - 1];

        if (lastState.labels) {
            const redoStack = redoStackRef.current[activeFrameFilePath] || [];
            redoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
            redoStackRef.current[activeFrameFilePath] = redoStack;

            pointLabelsRef.current[activeFrameFilePath] = lastState.labels;

            requestSaveLabels({ updateStack: false, isAutoSave: false });
        }

        if (lastState.objects) {
            const redoStack = redoStackRef.current[activeFrameFilePath] || [];
            redoStack.push({
                objects: cuboidsSolutionRef.current[activeFrameIndex],
                id: lastState.id,
            });
            redoStackRef.current[activeFrameFilePath] = redoStack;

            cuboidsSolutionRef.current[activeFrameIndex] = lastState.objects;

            updateCuboidPSR({ frame: activeFrameIndex });
            saveCurrentPSR({ frame: activeFrameIndex, cuboidId: lastState.id });
            findFrameMarkers();
            interpolatePSR({ updateStack: false, cuboidId: lastState.id });

            updateSingleCuboidRef.current = { needsUpdate: true, id: lastState.id };
        }

        undoStack.pop();
        onUndoRedo?.();
        updateUndoRedoState();
    }, [globalIsLoading, isPlaying, onUndoRedo, updateCuboidPSR, interpolatePSR]);

    useSubscribeFunction("undoAction", undoAction, []);

    const redoAction = useCallback(() => {
        if (!pcdFiles.length || globalIsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const redoStack = redoStackRef.current[activeFrameFilePath];

        if (!redoStack || redoStack.length === 0) return;

        const nextState = redoStack[redoStack.length - 1];

        if (nextState.labels) {
            const undoStack = undoStackRef.current[activeFrameFilePath] || [];
            undoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
            undoStackRef.current[activeFrameFilePath] = undoStack;

            pointLabelsRef.current[activeFrameFilePath] = nextState.labels;

            requestSaveLabels({ updateStack: false, isAutoSave: false });
        }

        if (nextState.objects) {
            const undoStack = undoStackRef.current[activeFrameFilePath] || [];
            undoStack.push({
                objects: cuboidsSolutionRef.current[activeFrameIndex],
                id: nextState.id,
            });
            undoStackRef.current[activeFrameFilePath] = undoStack;

            cuboidsSolutionRef.current[activeFrameIndex] = nextState.objects;

            updateCuboidPSR({ frame: activeFrameIndex });
            saveCurrentPSR({ frame: activeFrameIndex, cuboidId: nextState.id });
            findFrameMarkers();
            interpolatePSR({ updateStack: false, cuboidId: nextState.id });

            updateSingleCuboidRef.current = { needsUpdate: true, id: nextState.id };
        }

        redoStack.pop();
        onUndoRedo?.();
        updateUndoRedoState();
    }, [globalIsLoading, isPlaying, onUndoRedo, updateCuboidPSR, interpolatePSR]);

    useSubscribeFunction("redoAction", redoAction, []);

    useEffect(() => {
        if (globalIsLoading || isPlaying) return;
        updateUndoRedoState();
    }, [globalIsLoading, isPlaying, onUndoRedo]);

    return { updateUndoRedoState };
};
