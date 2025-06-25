export const infoBlocksConfig = (t) => [
    {
        title: [t("points")],
        type: "points",
        decimals: 0,
        buttons: null,
    },
    {
        title: [t("cuboidPosition")],
        type: "position",
        action: "position",
        unit: " m",
        buttons: {
            global: ["reset"],
            local: ["plus", "minus", "reset"],
        },
    },
    {
        title: [t("cuboidScale")],
        type: "scale",
        action: "scale",
        unit: " m",
        buttons: {
            global: ["reset", "sync"],
            local: ["plus", "minus", "reset"],
        },
    },
    {
        title: [t("cuboidRotation")],
        type: "rotation",
        action: "rotation",
        unit: "°",
        buttons: {
            global: ["reset"],
            local: ["plus", "minus", "reset"],
        },
    },
];
