// camera
export const DISTANCE_TO_CENTER = 15;
export const TWEEN_DURATION = 200;
export const PIXEL_PROJECTION_REQUEST_TIME = 100;

// editor helpers
export const CIRCLE_RULER_RADIUS = [35, 75]; // add elements if you need more circles (i.g. [35, 50, 75])

// geomtetry
export const POINT_SIZE_MULTIPLIER = 0.2;

// points position
export const Z_FILTER = {
    MIN: -2,
    MAX: 2,
    STEP: 0.05,
};
export const HIDDEN_POSITION = {
    Z_FILTER: 1e5,
    SELECTION: 1e6,
    CLASS_FILTER: 1e7,
};
export const HIDDEN_POINT = Math.min(...Object.values(HIDDEN_POSITION));

// highlighted point
export const DEFAULT_SEARCH_RADIUS = 5;

// canvas selection
export const SELECTION_OUTLINE = {
    FILL_COLOR: "#FFFFFF15", // rgba !!!
    FILL_TYPE: "evenodd",
    BORDER_COLOR: "#FFFF00", // rgb
    BORDER_WIDTH: 1.5,
};

// tools
export const DEFAULT_MODE = "paintFill";
export const DEFAULT_TOOL = "handPointer";
export const DEFAULT_BRUSH_SIZE = 40;

// save
export const SAVE_FRAME_REQUEST_TIME = 500;
export const UNDO_REDO_STACK_DEPTH = 10;
