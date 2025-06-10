import { useCallback } from "react";

import { useEvent } from "contexts";

export const useSaveSolution = () => {
    const { publish } = useEvent();

    const saveLabelsSolution = useCallback(
        ({ updateStack, isAutoSave }) => {
            publish("saveLabelsSolution", { updateStack: updateStack, isAutoSave: isAutoSave });
        },
        [publish],
    );

    const saveObjectsSolution = useCallback(
        ({ updateStack, isAutoSave, id = null }) => {
            publish("saveObjectsSolution", {
                updateStack: updateStack,
                isAutoSave: isAutoSave,
                id: id,
            });
        },
        [publish],
    );

    return { saveLabelsSolution, saveObjectsSolution };
};
