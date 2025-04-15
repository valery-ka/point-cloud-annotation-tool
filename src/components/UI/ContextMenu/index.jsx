import React, { useRef, useEffect } from "react";

export const ContextMenu = ({ position, itemsList, onSelect, onClose, setMenuDimensions }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        if (menuRef.current) {
            const { offsetWidth, offsetHeight } = menuRef.current;
            setMenuDimensions({ width: offsetWidth, height: offsetHeight });
        }
    }, [itemsList]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!position) return null;

    const { x, y } = position;

    return (
        <div className="ui-context-menu" style={{ top: y, left: x }} ref={menuRef}>
            <div className="ui-context-menu-content">
                {itemsList.map((item) => (
                    <div
                        key={item}
                        className="ui-context-menu-item-container"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item);
                            onClose();
                        }}
                    >
                        {/* можно добавить объект в конфиге с элиасами для каждой камеры */}
                        <div className="ui-context-menu-item">{item}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
