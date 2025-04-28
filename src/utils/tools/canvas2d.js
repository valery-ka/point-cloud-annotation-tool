import * as APP_CONSTANTS from "constants";

const {
    FILL_COLOR_LIGHT,
    FILL_COLOR_DARK,
    FILL_TYPE,
    BORDER_WIDTH,
    BORDER_COLOR_LIGHT,
    BORDER_COLOR_DARK,
} = APP_CONSTANTS.SELECTION_OUTLINE;

export function updateCanvasSize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true; // should be redrawed
    }
    return false;
}

export function clearCanvas(context, canvas) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPolyLine(context, theme, polygon) {
    if (!polygon || !polygon.length) return;

    context.beginPath();
    context.moveTo(polygon[0][0], polygon[0][1]);

    for (let i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i][0], polygon[i][1]);
    }

    const isLight = theme === "light";

    context.lineTo(polygon[0][0], polygon[0][1]);
    context.fillStyle = isLight ? FILL_COLOR_LIGHT : FILL_COLOR_DARK;
    context.fill(FILL_TYPE);
    context.lineWidth = BORDER_WIDTH;
    context.strokeStyle = isLight ? BORDER_COLOR_LIGHT : BORDER_COLOR_DARK;
    context.stroke();
}

export function hoveredPoint(context, theme, point, radius = 3) {
    if (point) {
        const { u, v } = point;
        const isLight = theme === "light";

        context.beginPath();
        context.arc(u, v, radius, 0, Math.PI * 2);
        context.fillStyle = isLight ? BORDER_COLOR_LIGHT : BORDER_COLOR_DARK;
        context.fill();
    }
}
