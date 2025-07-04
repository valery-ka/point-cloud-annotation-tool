import { memo } from "react";

import { AssetRMB, AssetLasso } from "./icons";

export const SVGIcon = memo(({ icon }) => {
    const assetIcon = {
        RMB: <AssetRMB />,
        Lasso: <AssetLasso />,
    };

    return assetIcon[icon] || icon;
});
