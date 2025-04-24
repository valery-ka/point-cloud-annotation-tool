import { selectByPolygon } from "../selection";

function makePixelProjections(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(i, Math.random() * 1000, Math.random() * 1000);
    }
    return arr;
}

function makePositions(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(Math.random() * 10, Math.random() * 10, Math.random() * 10);
    }
    return arr;
}

jest.mock("constants", () => ({
    HIDDEN_POSITION: {
        Z_FILTER: 1e5,
        SELECTION: 1e6,
        CLASS_FILTER: 1e7,
    },
    HIDDEN_POINT: Math.min(1e5, 1e6, 1e7),
    SELECTION_OUTLINE: {
        FILL_COLOR: "#FFFFFF15",
        FILL_TYPE: "evenodd",
        BORDER_COLOR: "#FFFF00",
        BORDER_WIDTH: 1.5,
    },
    DEFAULT_MODE: "paintFill",
    DEFAULT_TOOL: "handPointer",
    DEFAULT_BRUSH_SIZE: 40,
}));

const n = 100000;

test(`selectByPolygon performance on ${n} points`, () => {
    const pixelProjections = makePixelProjections(n);
    const positions = makePositions(n);

    const polygon = [
        [100, 100],
        [100, 900],
        [900, 900],
        [900, 100],
    ];

    const labels = Array(n).fill(0);
    const selection = { selectionMode: "paintFill", highlightedPoint: null, paintDepth: 0.03 };
    const classIndex = 1;
    const depthZ = 0.05;

    const t0 = performance.now();
    selectByPolygon(positions, pixelProjections, labels, classIndex, selection, depthZ, polygon);
    const t1 = performance.now();

    console.log(`selectByPolygon on ${n} points took ${(t1 - t0).toFixed(2)} ms`);
});
