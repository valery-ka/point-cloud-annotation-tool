import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

export const Spoiler = ({ title, children, defaultIsOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultIsOpen);

    const toggleSpoiler = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="spoiler">
            <div className="spoiler-header" onClick={toggleSpoiler}>
                <h3>{title}</h3>
                <span className="spoiler-arrow">
                    <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
                </span>
            </div>
            {isOpen && <div className="spoiler-content">{children}</div>}
        </div>
    );
};
