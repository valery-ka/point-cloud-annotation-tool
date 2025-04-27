import SelectorTools from "./SelectorTools";

export default class LassoTool extends SelectorTools {
    handleMouseDown(ev) {
        if (ev.which === this.leftMouseButton) {
            this.getHoveredPoint();
            this.drawHoveredPoint();
            this.pushPoint(ev.offsetX, ev.offsetY);
        }
        if (ev.which === this.rightMouseButton) {
            this.rightButtonPressed = true;
        }
    }

    handleMouseUp(ev) {
        if (ev.which === this.leftMouseButton) {
            this.selectByPolygon(this.polygon);
            this.polygon.length = 0;
        }
        this.canvasSelectionIsDirty = true;
        this.rightButtonPressed = false;
        this.clearHoveredPoint();
        this.saveFrame();
    }

    handleMouseDrag(ev) {
        if (ev.which === this.leftMouseButton && !this.rightButtonPressed) {
            this.pushPoint(ev.offsetX, ev.offsetY);
        } else {
            this.polygon.length = 0;
        }
        this.canvasSelectionIsDirty = true;
    }
}
