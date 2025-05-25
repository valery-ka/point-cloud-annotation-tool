import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

export const ObjectCardInfoBlock = ({ title, action, data, buttons, decimals = 2, unit = "" }) => {
    const formatValue = (value) => {
        if (typeof value !== "number") return value;
        return `${value.toFixed(decimals)}${unit ? `${unit}` : ""}`;
    };

    return (
        <div className="object-card-info-block">
            <div className="object-card-info-block-title-container">
                <h3 className="object-card-info-block-title">{title}</h3>
                {buttons && (
                    <button
                        className="object-card-info-block-value-button"
                        onClick={() => {
                            Object.keys(data).forEach((_, index) => {
                                buttons.reset?.callback({ action, index });
                            });
                        }}
                    >
                        <FontAwesomeIcon icon={faRefresh} />
                    </button>
                )}
            </div>
            {Object.entries(data).map(([key, value], index) => (
                <div key={key} className="object-card-info-block-text">
                    <div>{key}</div>
                    <div className="object-card-info-block-value-container">
                        {formatValue(value)}
                        {buttons &&
                            Object.entries(buttons).map(([buttonKey, buttonConfig]) => (
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
};
