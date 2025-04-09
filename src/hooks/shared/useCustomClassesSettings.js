import { useEffect } from "react";

import { useConfig } from "@contexts";
import { generateClassHotkeys, generatePointsSizes } from "@utils/settings";

export const useCustomClassesSettings = (settings, updateSettings) => {
    const { nonHiddenClasses } = useConfig();

    useEffect(() => {
        if (!nonHiddenClasses.length) return;

        const hotkeys = settings.hotkeys;
        const allKeysAssigned = nonHiddenClasses.every(
            (cls, index) =>
                hotkeys["selectClass"]?.[`selectClass${cls.originalIndex}`]
        );

        if (!allKeysAssigned) {
            const updatedHotkeys = generateClassHotkeys(
                hotkeys,
                nonHiddenClasses
            );
            updateSettings({ hotkeys: updatedHotkeys });
        }

        const settingsSizes = settings.editorSettings.sizes;
        const pointSizes = nonHiddenClasses.map((cls, idx) => {
            return `${
                cls.label[0].toLowerCase() + cls.label.slice(1)
            }PointSize`;
        });
        const allSizesAssigned = nonHiddenClasses.every(
            (cls, index) => settingsSizes[pointSizes[index]] !== undefined
        );

        if (!allSizesAssigned) {
            const updatedPointSizes = generatePointsSizes(
                settingsSizes,
                nonHiddenClasses
            );
            const updatedEditorSettings = {
                ...settings.editorSettings,
                sizes: updatedPointSizes,
            };

            updateSettings({ editorSettings: updatedEditorSettings });
        }
    }, [nonHiddenClasses, settings.hotkeys]);
};
