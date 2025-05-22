import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const ObjectCardInfoBlock = ({ title, data, buttons, decimals = 2, unit = "" }) => {
    const formatValue = (value) => {
        if (typeof value !== "number") return value;
        return `${value.toFixed(decimals)}${unit ? `${unit}` : ""}`;
    };

    return (
        <div className="object-card-info-block">
            <h3 className="object-card-info-block-title">{title}</h3>
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
                                    onClick={() => buttonConfig.callback({ index, buttonKey })}
                                    onMouseDown={(e) => e.preventDefault()}
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
