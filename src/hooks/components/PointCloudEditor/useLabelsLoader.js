import { useEffect, useMemo, useRef } from "react";

import { useFileManager, useConfig, useLoading } from "contexts";

import { loadLabels } from "utils/editor";

export const useLabelsLoader = () => {
    const { folderName } = useFileManager();
    const { nonHiddenClasses, isSemanticSegmentationTask } = useConfig();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();

    const availableLabels = useMemo(() => {
        return new Set(nonHiddenClasses.map((cls) => cls.originalIndex));
    }, [nonHiddenClasses]);

    // labels loader
    const labelsCacheRef = useRef({});

    useEffect(() => {
        if (!loadedData.odometry) return;
        const message = "loadingLabels";

        const onFinish = () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                solution: {
                    ...prev.solution,
                    labels: true,
                },
            }));
        };

        if (!isSemanticSegmentationTask) {
            onFinish();
            return;
        }

        const loadAllLabels = async () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: true });
            if (!labelsCacheRef.current[folderName]) {
                const labels = await loadLabels(folderName);
                labelsCacheRef.current[folderName] = labels;
            }
            onFinish();
        };

        if (availableLabels.size) {
            loadAllLabels();
        }
    }, [availableLabels, folderName, loadedData.odometry, isSemanticSegmentationTask]);

    return { labelsCacheRef, availableLabels };
};
