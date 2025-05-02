import { memo } from "react";
import { Cuboid } from "./Cuboid";

export const CuboidManager = memo(() => {
    console.log(`current id: ${Date.now().toString()}`);

    return <Cuboid />;
});
