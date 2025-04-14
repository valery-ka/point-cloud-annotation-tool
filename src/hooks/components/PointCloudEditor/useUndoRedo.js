import { useEffect, useCallback } from "react";

import { useFileManager, useEditor, useFrames, useEvent } from "contexts";
import { useSubscribeFunction } from "hooks";

export const useUndoRedo = (requestSaveFrame, onUndoRedo) => {
    const { pcdFiles } = useFileManager();
    const { publish } = useEvent();
    const { pointLabelsRef, undoStackRef, redoStackRef } = useEditor();
    const { isPlaying, activeFrameIndex, arePointCloudsLoading } = useFrames();

    const updateUndoRedoState = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath] || [];
        const redoStack = redoStackRef.current[activeFrameFilePath] || [];

        publish(undoStack.length ? "enableUndo" : "disableUndo");
        publish(redoStack.length ? "enableRedo" : "disableRedo");
    }, [pcdFiles, arePointCloudsLoading, activeFrameIndex, publish]);

    const undoAction = useCallback(() => {
        if (!pcdFiles.length || arePointCloudsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const undoStack = undoStackRef.current[activeFrameFilePath];

        if (!undoStack || undoStack.length === 0) return;

        const lastState = undoStack[undoStack.length - 1];

        if (!lastState.labels) return;

        const redoStack = redoStackRef.current[activeFrameFilePath] || [];
        redoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
        redoStackRef.current[activeFrameFilePath] = redoStack;

        pointLabelsRef.current[activeFrameFilePath] = lastState.labels;

        undoStack.pop();
        onUndoRedo?.();
        updateUndoRedoState();

        requestSaveFrame(activeFrameIndex, false);
    }, [pcdFiles, arePointCloudsLoading, activeFrameIndex, isPlaying]);

    useSubscribeFunction("undoAction", undoAction, [
        pcdFiles,
        arePointCloudsLoading,
        activeFrameIndex,
        isPlaying,
    ]);

    const redoAction = useCallback(() => {
        if (!pcdFiles.length || arePointCloudsLoading || isPlaying) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const redoStack = redoStackRef.current[activeFrameFilePath];

        if (!redoStack || redoStack.length === 0) return;

        const nextState = redoStack[redoStack.length - 1];

        if (!nextState.labels) return;

        const undoStack = undoStackRef.current[activeFrameFilePath] || [];
        undoStack.push({ labels: pointLabelsRef.current[activeFrameFilePath] });
        undoStackRef.current[activeFrameFilePath] = undoStack;

        pointLabelsRef.current[activeFrameFilePath] = nextState.labels;

        redoStack.pop();
        onUndoRedo?.();
        updateUndoRedoState();

        requestSaveFrame(activeFrameIndex, false);
    }, [pcdFiles, arePointCloudsLoading, activeFrameIndex, isPlaying]);

    useSubscribeFunction("redoAction", redoAction, [
        pcdFiles,
        arePointCloudsLoading,
        activeFrameIndex,
        isPlaying,
    ]);

    useEffect(() => {
        if (arePointCloudsLoading || isPlaying) return;
        updateUndoRedoState();
    }, [pcdFiles, arePointCloudsLoading, activeFrameIndex, isPlaying]);

    return updateUndoRedoState;
};
