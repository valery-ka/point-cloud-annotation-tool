export const InfoCommands = (t) => [
    {
        title: t("batchInfoDialogGeneral"),
        items: [
            {
                command: t("closeBatchEditor"),
                hotkeys: ["Esc"],
            },
        ],
    },
    {
        title: t("batchInfoDialogTransform"),
        items: [
            {
                command: t("batchInfoDialogTranslate"),
                hotkeys: ["W", "A", "S", "D"],
            },
            {
                command: t("batchInfoDialogRotate"),
                hotkeys: ["Q", "E"],
            },
        ],
    },
    {
        title: t("batchInfoDialogActions"),
        items: [
            {
                command: t("batchInfoDialogHide"),
                hotkeys: ["Z"],
            },
            {
                command: t("batchInfoDialogShow"),
                hotkeys: ["X"],
            },
            {
                command: t("batchInfoDialogRemoveKeyframe"),
                hotkeys: ["RMB"],
            },
            {
                command: t("batchInfoDialogGoToFrame"),
                hotkeys: ["F"],
            },
        ],
    },
];
