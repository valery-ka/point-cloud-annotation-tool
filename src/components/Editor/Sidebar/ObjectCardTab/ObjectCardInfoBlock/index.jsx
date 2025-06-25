import { memo } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const ObjectCardInfoBlock = memo(
    ({ title, data, buttons, buttonsConfig, unit, decimals = 2, action }) => {
        const formatValue = (value) => {
            if (typeof value !== "number") return value;
            return `${value.toFixed(decimals)}${unit ? `${unit}` : ""}`;
        };

        const { global = [], local = [] } = buttonsConfig || {};

        return (
            <div className="object-card-info-block">
                <div className="object-card-info-block-title-container">
                    <h3 className="object-card-info-block-title">{title}</h3>
                    {buttonsConfig &&
                        Object.entries(buttons)
                            .filter(([key]) => global.includes(key))
                            .map(([key, button]) => (
                                <button
                                    key={key}
                                    className="object-card-info-block-value-button"
                                    onMouseUp={() => {
                                        Object.keys(data).forEach((_, index) => {
                                            button.callback({ action, index });
                                        });
                                    }}
                                >
                                    <FontAwesomeIcon icon={button.icon} />
                                </button>
                            ))}
                </div>
                {Object.entries(data).map(([key, value], index) => (
                    <div key={key} className="object-card-info-block-text">
                        <div>{key}</div>
                        <div className="object-card-info-block-value-container">
                            {formatValue(value)}
                            {buttonsConfig &&
                                Object.entries(buttons)
                                    .filter(([key]) => local.includes(key))
                                    .map(([buttonKey, buttonConfig]) => (
                                        <button
                                            key={buttonKey}
                                            className="object-card-info-block-value-button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (buttonConfig.continuous) {
                                                    buttonConfig.callback({ action, index });
                                                }
                                            }}
                                            onMouseUp={(e) => {
                                                e.preventDefault();
                                                if (!buttonConfig.continuous) {
                                                    buttonConfig.callback({ action, index });
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={buttonConfig.icon} />
                                        </button>
                                    ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
);
