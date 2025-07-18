import { useEffect, useRef, useCallback, useMemo, useState } from "react";

import {
    useFileManager,
    useEditor,
    useFrames,
    useSettings,
    useCuboids,
    useBatch,
    useLoading,
    useConfig,
} from "contexts";
import { useSubscribeFunction, useDebouncedCallback } from "hooks";

import { SaveOutputWorker, SaveObjectsWorker } from "workers";
import { saveLabels, saveObjects, formatPointLabels, formatObjects } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { UNDO_REDO_STACK_DEPTH, SAVE_LABELS_REQUEST_TIME, SAVE_OBJECTS_REQUEST_TIME } =
    APP_CONSTANTS;

export const useSaveOutput = (updateUndoRedoState) => {
    const { pcdFiles, folderName } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();
    const { pointLabelsRef, prevLabelsRef, undoStackRef, redoStackRef, setPendingSaveState } =
        useEditor();
    const { settings } = useSettings();

    const { prevCuboidsRef, cuboidsSolutionRef, cuboidEditingFrameRef } = useCuboids();
    const { batchEditingFrameRef } = useBatch();

    const { isDetectionTask, isSemanticSegmentationTask } = useConfig();

    const [hasUnsavedSolution, setHasUnsavedSolution] = useState(false);

    const kojimaRef = useRef(null);

    const labelsWorker = useRef(null);
    const objectsWorker = useRef(null);

    const labelsController = useRef(null);
    const objectsController = useRef(null);

    const isAutoSaveTimerEnabled = useMemo(() => {
        return settings.editorSettings.performance.autoSaveTimerEnabled;
    }, [settings.editorSettings.performance.autoSaveTimerEnabled]);

    const autoSaveTimer = useMemo(() => {
        return settings.editorSettings.performance.autoSaveTimer;
    }, [settings.editorSettings.performance.autoSaveTimer]);

    useEffect(() => {
        kojimaRef.current = new Audio("/sounds/kojima.mp3");
        kojimaRef.current.volume = 0.2;
        kojimaRef.current.load();

        labelsWorker.current = SaveOutputWorker();
        objectsWorker.current = SaveObjectsWorker();
        return () => {
            if (labelsWorker.current) {
                labelsWorker.current.terminate();
            }
            if (objectsWorker.current) {
                objectsWorker.current.terminate();
            }
        };
    }, []);

    const saveLabelsSolution = useCallback(
        async (controllerInstance) => {
            const signal = controllerInstance?.signal;

            const abortHandler = () => {
                if (labelsController.current === controllerInstance) {
                    labelsController.current = null;
                }
                signal?.removeEventListener("abort", abortHandler);
            };

            signal?.addEventListener("abort", abortHandler);

            try {
                const formattedLabels = formatPointLabels(folderName, pointLabelsRef.current);
                const labelsResult = await saveLabels(
                    folderName,
                    formattedLabels,
                    labelsWorker.current,
                    signal,
                );
                if (labelsResult.saved) {
                    setHasUnsavedSolution(false);
                    setPendingSaveState(false);
                }
            } catch (err) {
            } finally {
                signal?.removeEventListener("abort", abortHandler);
                if (labelsController.current === controllerInstance) {
                    labelsController.current = null;
                }
            }
        },
        [updateUndoRedoState],
    );

    const saveObjectsSolution = useCallback(
        async (controllerInstance) => {
            const signal = controllerInstance?.signal;

            const abortHandler = () => {
                if (objectsController.current === controllerInstance) {
                    objectsController.current = null;
                }
                signal?.removeEventListener("abort", abortHandler);
            };

            signal?.addEventListener("abort", abortHandler);

            try {
                const formattedObjects = formatObjects(
                    folderName,
                    cuboidsSolutionRef.current,
                    pcdFiles,
                );
                const objectsResult = await saveObjects(
                    folderName,
                    formattedObjects,
                    objectsWorker.current,
                    signal,
                );
                if (objectsResult.saved) {
                    setHasUnsavedSolution(false);
                    setPendingSaveState(false);
                }
            } catch (err) {
            } finally {
                signal?.removeEventListener("abort", abortHandler);
                if (objectsController.current === controllerInstance) {
                    objectsController.current = null;
                }
            }
        },
        [updateUndoRedoState],
    );

    const debouncedSaveLabels = useDebouncedCallback((controllerInstance) => {
        saveLabelsSolution(controllerInstance);
    }, SAVE_LABELS_REQUEST_TIME);

    const debouncedSaveObjects = useDebouncedCallback((controllerInstance) => {
        saveObjectsSolution(controllerInstance);
    }, SAVE_OBJECTS_REQUEST_TIME);

    const requestSaveLabels = useCallback(
        ({ updateStack = true, isAutoSave = false }) => {
            if (!pcdFiles.length || !isSemanticSegmentationTask) return;

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

            if (labelsController.current) {
                labelsController.current.abort();
            }

            const newController = new AbortController();
            labelsController.current = newController;

            setHasUnsavedSolution(true);
            if (isAutoSaveTimerEnabled && !isAutoSave) {
                return;
            }

            setPendingSaveState(true);

            debouncedSaveLabels(newController);
        },
        [saveLabelsSolution, pcdFiles, activeFrameIndex, isSemanticSegmentationTask],
    );

    const requestSaveObjects = useCallback(
        ({ updateStack = true, isAutoSave = false, id = null }) => {
            if (!pcdFiles.length || !isDetectionTask) return;

            const frame =
                batchEditingFrameRef.current ?? cuboidEditingFrameRef.current ?? activeFrameIndex;
            const activeFrameFilePath = pcdFiles[frame];

            if (!activeFrameFilePath) return;

            const activeFrameCuboids = cuboidsSolutionRef.current[frame];

            if (updateStack) {
                undoStackRef.current[activeFrameFilePath] ??= [];
                redoStackRef.current[activeFrameFilePath] = [];

                const previousCuboids = prevCuboidsRef.current[frame];

                undoStackRef.current[activeFrameFilePath] = [
                    ...undoStackRef.current[activeFrameFilePath].slice(
                        -(UNDO_REDO_STACK_DEPTH - 1),
                    ),
                    { objects: structuredClone(previousCuboids), id: id },
                ];
            }

            prevCuboidsRef.current[frame] = structuredClone(activeFrameCuboids);
            updateUndoRedoState?.();

            if (objectsController.current) {
                objectsController.current.abort();
            }

            const newController = new AbortController();
            objectsController.current = newController;

            setHasUnsavedSolution(true);

            cuboidEditingFrameRef.current = null;
            batchEditingFrameRef.current = null;

            if (isAutoSaveTimerEnabled && !isAutoSave) {
                return;
            }

            setPendingSaveState(true);

            debouncedSaveObjects(newController);
        },
        [saveObjectsSolution, pcdFiles, activeFrameIndex, isDetectionTask],
    );

    useEffect(() => {
        if (!pcdFiles.length || globalIsLoading) return;
        requestSaveLabels({ updateStack: false, isAutoSave: true });
        requestSaveObjects({ updateStack: false, isAutoSave: true });
    }, [pcdFiles, globalIsLoading]);

    useEffect(() => {
        if (isAutoSaveTimerEnabled && pcdFiles.length > 0 && !globalIsLoading) {
            const interval = setInterval(() => {
                requestSaveLabels({ updateStack: false, isAutoSave: true });
                requestSaveObjects({ updateStack: false, isAutoSave: true });
            }, autoSaveTimer * 1000);

            return () => clearInterval(interval);
        }
    }, [autoSaveTimer, globalIsLoading, isAutoSaveTimerEnabled]);

    useSubscribeFunction("saveLabelsSolution", requestSaveLabels, []);
    useSubscribeFunction("saveObjectsSolution", requestSaveObjects, []);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (hasUnsavedSolution) {
                event.returnValue = true;
                kojimaRef.current.play().catch((e) => console.error("Playback error:", e));
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedSolution]);

    return { requestSaveLabels, requestSaveObjects };
};
