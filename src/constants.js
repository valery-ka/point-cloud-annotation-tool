// camera
export const DISTANCE_TO_CENTER = 15;
export const TWEEN_DURATION = 200;
export const PIXEL_PROJECTION_REQUEST_TIME = 100;
export const LAYERS = {
    PRIMARY: 0,
    SECONDARY: 1,
};

// editor helpers
export const CIRCLE_RULER_RADIUS = [35, 75]; // add elements if you need more circles (i.g. [35, 50, 75])

// geomtetry
export const POINT_SIZE_MULTIPLIER = 0.2;

// points position
export const Z_FILTER = {
    MIN: -2,
    MAX: 15,
    STEP: 0.05,
};
export const HIDDEN_POSITION = {
    Z_FILTER: 1e5,
    SELECTION: 1e6,
    CLASS_FILTER: 1e7,
};
export const HIDDEN_POINT = Math.min(...Object.values(HIDDEN_POSITION));

// canvas selection
export const SELECTION_OUTLINE = {
    FILL_TYPE: "evenodd",
    BORDER_WIDTH: 1.5,
    FILL_COLOR_LIGHT: "#00000015", // rgba !!!
    FILL_COLOR_DARK: "#FFFFFF15", // rgba !!!
    BORDER_COLOR_LIGHT: "#667788", // rgb
    BORDER_COLOR_DARK: "#FFFF00", // rgb
};

// tools
export const DEFAULT_MODE = "paintFill";
export const DEFAULT_TOOL = "handPointer";
export const DEFAULT_BRUSH_SIZE = 40;

// camera
export const MIN_IMAGE_HEIGHT = 250;

// save
export const SAVE_FRAME_REQUEST_TIME = 500;
export const UNDO_REDO_STACK_DEPTH = 10;
