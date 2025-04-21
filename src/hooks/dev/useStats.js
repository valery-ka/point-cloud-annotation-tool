import { useEffect } from "react";
import Stats from "stats.js";

export const useStats = () => {
    useEffect(() => {
        const fps = new Stats();
        fps.showPanel(0);

        fps.dom.style.position = "absolute";
        fps.dom.style.top = "4px";
        fps.dom.style.right = "37px";
        fps.dom.style.left = "auto";
        fps.dom.style.zIndex = "10000";

        document.body.appendChild(fps.dom);

        let animationFrameId;

        const update = () => {
            fps.begin();
            fps.end();
            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (fps.dom && fps.dom.parentNode) {
                fps.dom.parentNode.removeChild(fps.dom);
            }
        };
    }, []);
};
