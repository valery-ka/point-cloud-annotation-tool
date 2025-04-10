import * as APP_CONSTANTS from "constants";

const { FILL_COLOR, FILL_TYPE, BORDER_WIDTH, BORDER_COLOR } = APP_CONSTANTS.SELECTION_OUTLINE;

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

export function drawPolyLine(context, polygon) {
    if (!polygon || !polygon.length) return;

    context.beginPath();
    context.moveTo(polygon[0][0], polygon[0][1]);

    for (let i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i][0], polygon[i][1]);
    }

    context.lineTo(polygon[0][0], polygon[0][1]);
    context.fillStyle = FILL_COLOR;
    context.fill(FILL_TYPE);
    context.lineWidth = BORDER_WIDTH;
    context.strokeStyle = BORDER_COLOR;
    context.stroke();
}

export function hoveredPoint(context, point, radius = 3) {
    if (point) {
        const { u, v } = point;
        context.beginPath();
        context.arc(u, v, radius, 0, Math.PI * 2);
        context.fillStyle = BORDER_COLOR;
        context.fill();
    }
}
