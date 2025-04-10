import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";

import { usePCDManager, useEditor, useFrames } from "contexts";

import { SaveOutputWorker } from "workers";
import { saveLabels, formatPointLabels } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { UNDO_REDO_STACK_DEPTH, SAVE_FRAME_REQUEST_TIME } = APP_CONSTANTS;

const debouncedSaveFrame = debounce(
    (saveFn, updateStack) => saveFn(updateStack),
    SAVE_FRAME_REQUEST_TIME,
);

export const useSaveOutput = (updateUndoRedoState) => {
    const { pcdFiles, folderName } = usePCDManager();
    const { activeFrameIndex, areFramesLoading } = useFrames();
    const { pointLabelsRef, prevLabelsRef, undoStackRef, redoStackRef, setPendingSaveState } =
        useEditor();

    const worker = useRef(null);

    useEffect(() => {
        worker.current = SaveOutputWorker();
        return () => {
            if (worker.current) {
                worker.current.terminate();
            }
        };
    }, []);

    const saveFrame = useCallback(async () => {
        const formattedData = formatPointLabels(pointLabelsRef.current);
        const result = await saveLabels(folderName, formattedData, worker.current);

        if (result.saved) {
            setPendingSaveState(false);
        }
    }, [updateUndoRedoState]);

    const requestSaveFrame = useCallback(
        (updateStack = true) => {
            setPendingSaveState(true);

            const filePath = pcdFiles[activeFrameIndex];

            const currentLabels = pointLabelsRef.current[filePath];
            const previousLabels = prevLabelsRef.current[filePath];

            if (updateStack) {
                undoStackRef.current[filePath] ??= [];
                redoStackRef.current[filePath] = [];

                undoStackRef.current[filePath] = [
                    ...undoStackRef.current[filePath].slice(-(UNDO_REDO_STACK_DEPTH - 1)),
                    { labels: new Uint8Array(previousLabels) },
                ];
            }
            prevLabelsRef.current[filePath] = new Uint8Array(currentLabels);
            updateUndoRedoState?.();

            debouncedSaveFrame(saveFrame, updateStack);
        },
        [saveFrame, pcdFiles, activeFrameIndex],
    );

    useEffect(() => {
        if (!pcdFiles.length || areFramesLoading) return;
        requestSaveFrame(false);
    }, [pcdFiles, areFramesLoading]);

    return requestSaveFrame;
};
