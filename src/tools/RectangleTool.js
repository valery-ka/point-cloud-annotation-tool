import SelectorTools from "./SelectorTools";

export default class RectangleTool extends SelectorTools {
    handleMouseDown(ev) {
        if (ev.which === this.leftMouseButton) {
            this.getHoveredPoint();
            this.drawHoveredPoint();
            this.pushPoint(ev.offsetX, ev.offsetY);
            this.startX = ev.offsetX;
            this.startY = ev.offsetY;
        }
        if (ev.which === this.rightMouseButton) {
            this.rightButtonPressed = true;
        }
    }

    handleMouseUp(ev) {
        if (ev.which === this.leftMouseButton) {
            this.selectByPolygon(this.polygon);
            this.polygon.length = 0;
            this.startX = this.startY = NaN;
        }
        this.rightButtonPressed = false;
        this.canvasSelectionIsDirty = true;
        this.clearHoveredPoint();
        this.actions.requestSaveFrame();
    }

    handleMouseDrag(ev) {
        if (ev.which === this.leftMouseButton && !this.rightButtonPressed) {
            this.polygon.length = 0;
            const fx = this.startX;
            const fy = this.startY;
            this.pushPoint(fx, fy);
            this.pushPoint(ev.offsetX, fy);
            this.pushPoint(ev.offsetX, ev.offsetY);
            this.pushPoint(fx, ev.offsetY);
            this.pushPoint(fx, fy);
        } else {
            this.polygon.length = 0;
        }
        this.canvasSelectionIsDirty = true;
    }
}
