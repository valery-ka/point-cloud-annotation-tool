import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const RenderFileNavigatorButton = ({ icon, title, className, onClick }) => {
    return (
        <>
            <FontAwesomeIcon
                icon={icon}
                className={`file-navigator-button ${className}`}
                onClick={onClick}
                data-tooltip-id={`tooltip-${title}`}
                data-tooltip-html={title}
                onMouseDown={(e) => e.preventDefault()}
            />
            <Tooltip id={`tooltip-${title}`} place="bottom" effect="solid" delayShow={300} />
        </>
    );
};
