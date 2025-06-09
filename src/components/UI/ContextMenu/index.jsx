import { useRef, useEffect } from "react";

export const ContextMenu = ({
    position,
    itemsList,
    onSelect,
    onClose,
    setMenuDimensions,
    selectMode = "item",
}) => {
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
                <div
                    key="none"
                    className="ui-context-menu-item-container"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect("none");
                        onClose();
                    }}
                >
                    <div className="ui-context-menu-item">none</div>
                </div>
                {itemsList.map((item, index) => (
                    <div
                        key={item}
                        className="ui-context-menu-item-container"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(selectMode === "index" ? index : item);
                            onClose();
                        }}
                    >
                        <div className="ui-context-menu-item">{item}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
