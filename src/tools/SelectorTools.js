import { MODES } from "tools";
import {
    updateCanvasSize,
    clearCanvas,
    drawPolyLine,
    hoveredPoint,
    selectByPolygon,
} from "utils/tools";
import * as APP_CONSTANTS from "constants";

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

        this.selectionData.selectionMode = DEFAULT_MODE;
        this.canvasSelection = document.querySelector("#canvasSelection");
        this.contextSelection = this.canvasSelection.getContext("2d");
    }

    updateProps(props) {
        this.props = props;
        Object.assign(this, props);
    }

    getHoveredPoint() {
        const point = this.selectionData.highlightedPoint;
        this.hoveredPoint = point ? { u: point.u, v: point.v, z: point.z } : null;
    }

    clearHoveredPoint() {
        this.hoveredPoint = null;
    }

    clearProjections() {
        this.cloudData.pixelProjections = new Float32Array();
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

    saveFrame() {
        const doSaveFrame = this.selectionData.selectionMode.includes("paint");
        if (doSaveFrame) {
            this.callbacks.requestSaveFrame({ updateStack: true, isAutoSave: false });
        }
    }

    pushPoint(x, y) {
        this.polygon.push([x, y]);
    }

    updateDrawingStatus(isDrawing) {
        this.isDrawing = isDrawing;
        if (this.callbacks.setIsDrawing) {
            this.callbacks.setIsDrawing(isDrawing);
        }
    }

    drawCanvasSelection() {
        if (!this.canvasSelectionIsDirty) return;
        const theme = this.selectionData.theme;

        updateCanvasSize(this.canvasSelection);
        clearCanvas(this.contextSelection, this.canvasSelection);
        const ctx = this.contextSelection;

        if (this.polygon && this.polygon.length) {
            drawPolyLine(ctx, theme, this.polygon);
        }
        this.drawHoveredPoint();
        this.canvasSelectionIsDirty = false;
    }

    drawHoveredPoint() {
        if (this.hoveredPoint && this.selectionData.selectionMode === "paintDepth") {
            const theme = this.selectionData.theme;
            hoveredPoint(this.contextSelection, theme, this.hoveredPoint);
        }
    }

    selectByPolygon(polygon) {
        const polygonParams = {
            isBrushTool: this.constructor.name === "BrushTool",
            brushCenter: [this.lastMouseX, this.lastMouseY],
            brushRadius: this.radius,
            polygon: polygon,
        };

        const selectedPoints = selectByPolygon({
            cloudData: this.cloudData,
            selectionData: {
                ...this.selectionData,
                highlightedPointZ: this.hoveredPoint?.z,
            },
            polygonParams: polygonParams,
        });
        this.handleSelectedPoint(selectedPoints);
    }

    handleSelectedPoint(selectedPoints) {
        const modeType = MODES[this.selectionData.selectionMode]?.type;
        const { paintSelectedPoints, handleSelectedPointsSize, filterSelectedPoints } =
            this.callbacks;

        if (modeType === "paint") {
            paintSelectedPoints?.(this.selectionData.selectionMode, selectedPoints);
            handleSelectedPointsSize?.(selectedPoints);
        } else if (modeType === "filter") {
            filterSelectedPoints?.(this.selectionData.selectionMode, selectedPoints);
        }
    }
}
