import { useRef, useEffect } from "react";

export const ContextMenu = ({
    position,
    itemsList,
    onSelect,
    onClose,
    setMenuDimensions,
    selectMode = "item",
    hasNone = true,
}) => {
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuRef.current) return;

        const observer = new ResizeObserver(() => {
            const { offsetWidth, offsetHeight } = menuRef.current;
            setMenuDimensions({ width: offsetWidth, height: offsetHeight });
        });

        observer.observe(menuRef.current);
        return () => observer.disconnect();
    }, []);

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
                {hasNone && (
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
                )}
                {itemsList.map((item, index) => (
                    <div
                        key={`${item}_${index}`}
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
