import { useEffect, useRef, useCallback } from "react";

import { usePCDManager, useEditor, useFrames } from "contexts";

import { SaveOutputWorker } from "workers";
import { saveLabels } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { UNDO_REDO_STACK_DEPTH, SAVE_FRAME_REQUEST_TIME } = APP_CONSTANTS;

export const useSaveOutput = (updateUndoRedoState) => {
    const { pcdFiles } = usePCDManager();
    const { activeFrameIndex, areFramesLoading } = useFrames();
    const { pointLabelsRef, prevLabelsRef, undoStackRef, redoStackRef, setPendingSaveState } =
        useEditor();

    const worker = useRef(null);
    const prevFrameIndex = useRef(activeFrameIndex);
    const saveQueue = useRef([]);
    const saveTimers = useRef({});

    useEffect(() => {
        worker.current = SaveOutputWorker();
        return () => {
            if (worker.current) {
                worker.current.terminate();
            }
        };
    }, []);

    const saveFrame = useCallback(
        async (frameIndex, updateStack) => {
            if (!pcdFiles[frameIndex]) return;
            setPendingSaveState(true);

            const filePath = pcdFiles[frameIndex];
            const labels = pointLabelsRef.current[filePath];
            const previousLabels = prevLabelsRef.current[filePath];

            const path = filePath.split("/");
            const fileName = path.pop();
            const folderName = path.pop();

            const result = await saveLabels(
                { folderName, fileName },
                labels,
                previousLabels,
                worker.current,
            );

            if (result.saved) {
                if (updateStack) {
                    undoStackRef.current[filePath] ??= [];
                    redoStackRef.current[filePath] = [];

                    undoStackRef.current[filePath] = [
                        ...undoStackRef.current[filePath].slice(-(UNDO_REDO_STACK_DEPTH - 1)),
                        { labels: new Uint8Array(previousLabels) },
                    ];
                }
                prevLabelsRef.current[filePath] = new Uint8Array(labels);
                updateUndoRedoState?.();
            }

            setPendingSaveState(false);
        },
        [pcdFiles, updateUndoRedoState],
    );

    const processQueue = useCallback(
        async (updateStack) => {
            while (saveQueue.current.length > 0) {
                const frameIndex = saveQueue.current.shift();
                await saveFrame(frameIndex, updateStack);
            }
        },
        [saveFrame],
    );

    const requestSaveFrame = useCallback(
        (frameIndex, updateStack = true) => {
            if (saveTimers.current[frameIndex]) {
                clearTimeout(saveTimers.current[frameIndex]);
            }

            saveTimers.current[frameIndex] = setTimeout(() => {
                saveQueue.current.push(frameIndex);
                processQueue(updateStack);
            }, SAVE_FRAME_REQUEST_TIME);
        },
        [processQueue],
    );

    useEffect(() => {
        if (!pcdFiles.length || areFramesLoading) return;

        if (prevFrameIndex.current !== activeFrameIndex) {
            requestSaveFrame(prevFrameIndex.current);
            prevFrameIndex.current = activeFrameIndex;
        }
    }, [pcdFiles, activeFrameIndex, areFramesLoading, requestSaveFrame]);

    return requestSaveFrame;
};
