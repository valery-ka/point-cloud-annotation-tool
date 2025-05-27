import { memo } from "react";

import { EditorSideLeftControls } from "./EditorSideLeftControls";
import { EditorTopLeftControls } from "./EditorTopLeftControls";
import { EditorTopRightControls } from "./EditorTopRightControls";

export const EditorControls = memo(() => {
    return (
        <>
            <EditorTopLeftControls />
            <EditorSideLeftControls />
            <EditorTopRightControls />
        </>
    );
});
