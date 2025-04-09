export const generateClassHotkeys = (existingHotkeys, configClasses) => {
    const newHotkeys = { ...existingHotkeys };

    ["selectClass", "hideClass", "showClass"].forEach(
        (key) => (newHotkeys[key] ??= {})
    );

    configClasses.forEach(({ originalIndex }, index) => {
        newHotkeys.selectClass[`selectClass${originalIndex}`] ??= (
            index + 1
        ).toString();
        newHotkeys.hideClass[`hideClass${originalIndex}`] ??= `shift+${
            index + 1
        }`;
        newHotkeys.showClass[`showClass${originalIndex}`] ??= `alt+${
            index + 1
        }`;
    });

    return newHotkeys;
};

export const generatePointsSizes = (existingSizes, configClasses) => {
    const newSizes = { ...existingSizes };

    configClasses.forEach((cls) => {
        const key = `${
            cls.label[0].toLowerCase() + cls.label.slice(1)
        }PointSize`;

        if (!newSizes[key]) {
            newSizes[key] = 0.0;
        }
    });

    return newSizes;
};

export const getTranslatedCommand = (command, nonHiddenClasses, t) => {
    const match = command.match(/([a-zA-Z]+)(\d+)/);
    const commandType = match ? match[1] : command;
    const originalIndex = match ? parseInt(match[2], 10) : "";
    const classLabel = nonHiddenClasses.find(
        cls => cls.originalIndex === originalIndex
    )?.label || originalIndex;

    return `${t(commandType)} ${classLabel}`;
};
