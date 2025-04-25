import SelectorTools from "./SelectorTools";
import * as APP_CONSTANTS from "constants";

const { DEFAULT_BRUSH_SIZE } = APP_CONSTANTS;

export default class BrushTool extends SelectorTools {
    constructor(props) {
        super(props);
        this.radius = DEFAULT_BRUSH_SIZE;
        this.minRadius = 10;
        this.maxRadius = 100;
        this.step = 10;
    }

    updatePolygon() {
        const precision = 64;
        const PI_doubled = Math.PI * 2;
        const centerX = this.lastMouseX;
        const centerY = this.lastMouseY;

        this.polygon.length = 0;

        for (let angle = 0; angle < PI_doubled; angle += PI_doubled / precision) {
            this.pushPoint(
                centerX + this.radius * Math.cos(angle),
                centerY - this.radius * Math.sin(angle),
            );
        }
        this.canvasSelectionIsDirty = true;
    }

    handleMouseMove(ev) {
        this.lastMouseX = ev.offsetX;
        this.lastMouseY = ev.offsetY;
        this.drawCanvasSelection();
        this.updatePolygon();
    }

    handleMouseDown(ev) {
        if (ev.which === this.leftMouseButton) {
            this.getHoveredPoint();
            this.drawHoveredPoint();
            this.selectByPolygon(this.polygon);
        }
    }

    handleMouseDrag(ev) {
        if (ev.which === this.leftMouseButton) {
            this.selectByPolygon(this.polygon);
        }
    }

    handleMouseUp(ev) {
        if (ev.which === this.leftMouseButton) {
            this.clearHoveredPoint();
            this.callbacks.requestSaveFrame({ updateStack: true, isAutoSave: false });
        }
    }

    handleMouseWheel(ev) {
        if (ev.ctrlKey) {
            if (ev.deltaY < 0) {
                this.radius = Math.min(this.maxRadius, this.radius + this.step);
                this.updatePolygon();
            } else if (ev.deltaY > 0) {
                this.radius = Math.max(this.minRadius, this.radius - this.step);
                this.updatePolygon();
            }
        }
    }

    handleMouseLeave() {
        this.polygon.length = 0;
        this.canvasSelectionIsDirty = true;
    }
}
