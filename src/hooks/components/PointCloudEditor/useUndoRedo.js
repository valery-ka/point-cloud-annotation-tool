import { useEffect, useCallback } from "react";

import { useFileManager, useEditor, useFrames, useEvent, useCuboids } from "contexts";
import { useSubscribeFunction, useCuboidInterpolation } from "hooks";

export const useUndoRedo = (requestSaveLabels, onUndoRedo) => {
    const { publish } = useEvent();

    const { pcdFiles } = useFileManager();
    const { pointLabelsRef, undoStackRef, redoStackRef } = useEditor();
    const { isPlaying, activeFrameIndex, arePointCloudsLoading } = useFrames();

    const { cuboidsSolutionRef } = useCuboids();

    const { saveCurrentPSR, interpolatePSR, findFrameMarkers, updateCuboidPSR } =
        useCuboidInterpolation();

    const updateUndoRedoState = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath] || [];
        const redoStack = redoStackRef.current[activeFrameFilePath] || [];

        publish(undoStack.length ? "enableUndo" : "disableUndo");
        publish(redoStack.length ? "enableRedo" : "disableRedo");
    }, [onUndoRedo, arePointCloudsLoading, publish]);

    const undoAction = useCallback(() => {
        if (!pcdFiles.length || arePointCloudsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath];

        if (!undoStack || undoStack.length === 0) return;

        const lastState = undoStack[undoStack.length - 1];

        if (lastState.labels) {
            const redoStack = redoStackRef.current[activeFrameFilePath] || [];
            redoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
            redoStackRef.current[activeFrameFilePath] = redoStack;

            pointLabelsRef.current[activeFrameFilePath] = lastState.labels;

            undoStack.pop();
            onUndoRedo?.();
            updateUndoRedoState();

            requestSaveLabels({ updateStack: false, isAutoSave: false });
        }

        if (lastState.objects) {
            const redoStack = redoStackRef.current[activeFrameFilePath] || [];
            redoStack.push({ objects: cuboidsSolutionRef.current[activeFrameIndex] });
            redoStackRef.current[activeFrameFilePath] = redoStack;

            cuboidsSolutionRef.current[activeFrameIndex] = lastState.objects;
            undoStack.pop();

            updateCuboidPSR(activeFrameIndex);
            saveCurrentPSR({ activeFrameIndex: activeFrameIndex });
            findFrameMarkers();

            onUndoRedo?.();
            updateUndoRedoState();

            interpolatePSR(false);
        }
    }, [arePointCloudsLoading, isPlaying, onUndoRedo, updateCuboidPSR, interpolatePSR]);

    useSubscribeFunction("undoAction", undoAction, []);

    const redoAction = useCallback(() => {
        if (!pcdFiles.length || arePointCloudsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const redoStack = redoStackRef.current[activeFrameFilePath];

        if (!redoStack || redoStack.length === 0) return;

        const nextState = redoStack[redoStack.length - 1];

        if (nextState.labels) {
            const undoStack = undoStackRef.current[activeFrameFilePath] || [];
            undoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
            undoStackRef.current[activeFrameFilePath] = undoStack;

            pointLabelsRef.current[activeFrameFilePath] = nextState.labels;

            redoStack.pop();
            onUndoRedo?.();
            updateUndoRedoState();

            requestSaveLabels({ updateStack: false, isAutoSave: false });
        }

        if (nextState.objects) {
            const undoStack = undoStackRef.current[activeFrameFilePath] || [];
            undoStack.push({ objects: cuboidsSolutionRef.current[activeFrameIndex] });
            undoStackRef.current[activeFrameFilePath] = undoStack;

            cuboidsSolutionRef.current[activeFrameIndex] = nextState.objects;
            redoStack.pop();

            updateCuboidPSR(activeFrameIndex);
            saveCurrentPSR({ activeFrameIndex: activeFrameIndex });
            findFrameMarkers();

            onUndoRedo?.();
            updateUndoRedoState();

            interpolatePSR(false);
        }
    }, [arePointCloudsLoading, isPlaying, onUndoRedo, updateCuboidPSR, interpolatePSR]);

    useSubscribeFunction("redoAction", redoAction, []);

    useEffect(() => {
        if (arePointCloudsLoading || isPlaying) return;
        updateUndoRedoState();
    }, [arePointCloudsLoading, isPlaying, onUndoRedo]);

    return { updateUndoRedoState };
};
