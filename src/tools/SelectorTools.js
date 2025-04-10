import { MODES } from "@tools";
import {
    updateCanvasSize,
    clearCanvas,
    drawPolyLine,
    hoveredPoint,
    selectByPolygon,
} from "@utils/tools";
import * as APP_CONSTANTS from "@constants";

const { DEFAULT_MODE } = APP_CONSTANTS;

export default class SelectorTools {
    constructor(props) {
        this.props = {};
        this.updateProps(props);

        this.polygon = [];

        this.leftMouseButton = 1;
        this.rightMouseButton = 3;

        this.hoveredPoint = null;
        this.isDrawing = false; // is only used for polygon tool

        this.selection.selectionMode = DEFAULT_MODE;
        this.canvasSelection = document.querySelector("#canvasSelection");
        this.contextSelection = this.canvasSelection.getContext("2d");
    }

    updateProps(props) {
        this.props = props;
        Object.assign(this, props);
    }

    getHoveredPoint() {
        const point = this.selection.highlightedPoint;
        this.hoveredPoint = point ? { u: point.u, v: point.v, z: point.z } : null;
    }

    clearHoveredPoint() {
        this.hoveredPoint = null;
    }

    clearProjections() {
        this.frameData.pixelProjections = new Float32Array();
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        if (this.canvasSelectionIsDirty) {
            this.drawCanvasSelection();
        }
    }

    activate() {
        this.polygon.length = 0;
        this.updateDrawingStatus(false);
        this.canvasSelectionIsDirty = true;
        this.animate();
    }

    deactivate() {
        this.polygon.length = 0;
        this.updateDrawingStatus(false);
        clearCanvas(this.contextSelection, this.canvasSelection);
        this.canvasSelectionIsDirty = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    pushPoint(x, y) {
        this.polygon.push([x, y]);
    }

    updateDrawingStatus(isDrawing) {
        this.isDrawing = isDrawing;
        if (this.actions.setIsDrawing) {
            this.actions.setIsDrawing(isDrawing);
        }
    }

    drawCanvasSelection() {
        if (!this.canvasSelectionIsDirty) return;

        updateCanvasSize(this.canvasSelection);
        clearCanvas(this.contextSelection, this.canvasSelection);
        const ctx = this.contextSelection;

        if (this.polygon && this.polygon.length) {
            drawPolyLine(ctx, this.polygon);
        }
        this.drawHoveredPoint();
        this.canvasSelectionIsDirty = false;
    }

    drawHoveredPoint() {
        if (this.hoveredPoint && this.selection.selectionMode == "paintDepth") {
            hoveredPoint(this.contextSelection, this.hoveredPoint);
        }
    }

    selectByPolygon(polygon) {
        const selectedPoints = selectByPolygon(
            this.frameData.positions.current,
            this.frameData.pixelProjections,
            this.frameData.activeLabels,
            this.classData.originalClassIndex,
            this.selection,
            this.hoveredPoint?.z,
            polygon,
        );

        this.handleSelectedPoint(selectedPoints);
    }

    handleSelectedPoint(selectedPoints) {
        const modeType = MODES[this.selection.selectionMode]?.type;
        if (modeType === "paint") {
            this.actions.paintSelectedPoints?.(this.selection.selectionMode, selectedPoints);
            this.actions.handleSelectedPointsSize?.(selectedPoints);
        } else if (modeType === "filter") {
            this.actions.filterSelectedPoints?.(this.selection.selectionMode, selectedPoints);
        }
    }
}
