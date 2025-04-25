import { selectByPolygon } from "../selection";
import { positions } from "../__fixtures__/positions";
import { pixelProjections } from "../__fixtures__/pixelProjections";
import { labels } from "../__fixtures__/labels";
import { classIndex } from "../__fixtures__/classIndex";
import { selection } from "../__fixtures__/selection";
import { depthZ } from "../__fixtures__/depthZ";

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

const basePolygon = [
    [0, 0],
    [1000, 0],
    [1000, 1000],
    [0, 1000],
];

function getRandomOffsetPolygon(base, maxOffset = 50) {
    const offsetX = Math.random() * maxOffset * 2 - maxOffset;
    const offsetY = Math.random() * maxOffset * 2 - maxOffset;

    return base.map(([x, y]) => [x + offsetX, y + offsetY]);
}

test("measure continuous selectByPolygon calls", async () => {
    const callCount = 50;
    const executionTimes = [];

    const coldStartTime = performance.now();
    selectByPolygon(
        positions,
        pixelProjections,
        labels,
        classIndex,
        selection,
        depthZ,
        basePolygon,
    );
    const coldStartDuration = performance.now() - coldStartTime;
    console.log(`Cold start time: ${coldStartDuration.toFixed(2)}ms`);

    const totalStartTime = performance.now();

    for (let i = 0; i < callCount; i++) {
        const polygon = getRandomOffsetPolygon(basePolygon);
        const startTime = performance.now();

        selectByPolygon(
            positions,
            pixelProjections,
            labels,
            classIndex,
            selection,
            depthZ,
            polygon,
        );

        const duration = performance.now() - startTime;
        executionTimes.push(duration);

        if (i < callCount - 1) {
            await new Promise((resolve) => setTimeout(resolve, 8));
        }
    }

    const totalDuration = performance.now() - totalStartTime;

    const avgTime = executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length;
    const minTime = Math.min(...executionTimes);
    const maxTime = Math.max(...executionTimes);

    console.log(`Total calls: ${callCount}`);
    console.log(`Total duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`Average per call: ${avgTime.toFixed(2)}ms`);
    console.log(`Min time: ${minTime.toFixed(2)}ms`);
    console.log(`Max time: ${maxTime.toFixed(2)}ms`);
    console.log(
        "All execution times:",
        executionTimes.map((t) => t.toFixed(2)).join("ms, ") + "ms",
    );

    expect(avgTime).toBeLessThan(100);

    console.log("Performance graph:");
    executionTimes.forEach((t, i) => {
        const bar = "■".repeat(Math.round(t / 5));
        console.log(`Call ${i + 1}: ${bar} ${t.toFixed(2)}ms`);
    });
});
