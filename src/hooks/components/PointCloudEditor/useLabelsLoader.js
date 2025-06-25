import { useEffect, useMemo, useRef, useState } from "react";

import { useFileManager, useConfig } from "contexts";

import { loadLabels } from "utils/editor";

export const useLabelsLoader = () => {
    const { folderName } = useFileManager();
    const { nonHiddenClasses } = useConfig();

    const availableLabels = useMemo(() => {
        return new Set(nonHiddenClasses.map((cls) => cls.originalIndex));
    }, [nonHiddenClasses]);

    // labels loader
    const labelsCacheRef = useRef({});

    const [areLabelsLoaded, setAreLabelsLoaded] = useState(false);

    useEffect(() => {
        const loadAllLabels = async () => {
            if (!labelsCacheRef.current[folderName]) {
                const labels = await loadLabels(folderName);
                labelsCacheRef.current[folderName] = labels;
                console.log("labels", labels);
            }
            setAreLabelsLoaded(true);
        };

        if (availableLabels.size) {
            loadAllLabels();
        }
    }, [availableLabels, folderName]);

    return { labelsCacheRef, areLabelsLoaded, availableLabels };
};
