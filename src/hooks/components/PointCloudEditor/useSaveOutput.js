import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { debounce } from "lodash";

import { useFileManager, useEditor, useFrames, useSettings } from "contexts";
import { useSubscribeFunction } from "hooks";

import { SaveOutputWorker } from "workers";
import { saveLabels, formatPointLabels } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { UNDO_REDO_STACK_DEPTH, SAVE_FRAME_REQUEST_TIME } = APP_CONSTANTS;

const debouncedSaveFrame = debounce((run) => {
    run();
}, SAVE_FRAME_REQUEST_TIME);

export const useSaveOutput = (updateUndoRedoState) => {
    const { pcdFiles, folderName } = useFileManager();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();
    const { pointLabelsRef, prevLabelsRef, undoStackRef, redoStackRef, setPendingSaveState } =
        useEditor();
    const { settings } = useSettings();

    const [hasUnsavedSolution, setHasUnsavedSolution] = useState(false);

    const worker = useRef(null);
    const controller = useRef(null);

    const isAutoSaveTimerEnabled = useMemo(() => {
        return settings.editorSettings.performance.autoSaveTimerEnabled;
    }, [settings.editorSettings.performance.autoSaveTimerEnabled]);

    const autoSaveTimer = useMemo(() => {
        return settings.editorSettings.performance.autoSaveTimer;
    }, [settings.editorSettings.performance.autoSaveTimer]);

    useEffect(() => {
        worker.current = SaveOutputWorker();
        return () => {
            if (worker.current) {
                worker.current.terminate();
            }
        };
    }, []);

    const saveFrame = useCallback(
        async (controllerInstance) => {
            const signal = controllerInstance?.signal;

            const abortHandler = () => {
                if (controller.current === controllerInstance) {
                    controller.current = null;
                }
                signal?.removeEventListener("abort", abortHandler);
            };

            signal?.addEventListener("abort", abortHandler);

            try {
                const formattedData = formatPointLabels(folderName, pointLabelsRef.current);
                const result = await saveLabels(folderName, formattedData, worker.current, signal);
                if (result.saved) {
                    setHasUnsavedSolution(false);
                    setPendingSaveState(false);
                }
            } catch (err) {
            } finally {
                signal?.removeEventListener("abort", abortHandler);
                if (controller.current === controllerInstance) {
                    controller.current = null;
                }
            }
        },
        [updateUndoRedoState],
    );

    const requestSaveFrame = useCallback(
        ({ updateStack = true, isAutoSave = false }) => {
            if (!pcdFiles.length) return;

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (updateStack) {
                undoStackRef.current[activeFrameFilePath] ??= [];
                redoStackRef.current[activeFrameFilePath] = [];

                const previousLabels = prevLabelsRef.current[activeFrameFilePath];
                undoStackRef.current[activeFrameFilePath] = [
                    ...undoStackRef.current[activeFrameFilePath].slice(
                        -(UNDO_REDO_STACK_DEPTH - 1),
                    ),
                    { labels: new Uint8Array(previousLabels) },
                ];
            }

            prevLabelsRef.current[activeFrameFilePath] = new Uint8Array(activeFrameLabels);
            updateUndoRedoState?.();

            if (controller.current) {
                controller.current.abort();
            }

            const newController = new AbortController();
            controller.current = newController;

            setHasUnsavedSolution(true);
            if (isAutoSaveTimerEnabled && !isAutoSave) {
                return;
            }

            setPendingSaveState(true);

            debouncedSaveFrame(() => {
                saveFrame(newController);
            });
        },
        [saveFrame, pcdFiles, activeFrameIndex],
    );

    useEffect(() => {
        if (!pcdFiles.length || arePointCloudsLoading) return;
        requestSaveFrame({ updateStack: false, isAutoSave: true });
    }, [pcdFiles, arePointCloudsLoading]);

    useEffect(() => {
        if (isAutoSaveTimerEnabled && pcdFiles.length > 0 && !arePointCloudsLoading) {
            const interval = setInterval(() => {
                requestSaveFrame({ updateStack: false, isAutoSave: true });
            }, autoSaveTimer * 1000);

            return () => clearInterval(interval);
        }
    }, [autoSaveTimer, arePointCloudsLoading, isAutoSaveTimerEnabled]);

    useSubscribeFunction("saveSolution", requestSaveFrame, []);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (hasUnsavedSolution) {
                event.returnValue = true;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedSolution]);

    return requestSaveFrame;
};
