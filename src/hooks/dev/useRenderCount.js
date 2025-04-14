import { useRef } from "react";

export const useRenderCount = (label = "RenderCount") => {
    const count = useRef(1);
    console.log(`[${label}] rerender #${count.current++}`);
};
