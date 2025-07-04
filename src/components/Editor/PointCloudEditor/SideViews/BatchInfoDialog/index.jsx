import { memo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSubscribeFunction } from "hooks";

import { SVGIcon } from "assets/SVGIcon";
import { Dialog } from "components";

import { InfoCommands } from "./InfoCommands";

const COMPONENT_NAME = "BatchInfoDialog.";
// const COMPONENT_NAME = "";

export const BatchInfoDialog = memo(() => {
    const { t } = useTranslation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const openBatchInfoDialog = useCallback(() => {
        setIsDialogOpen(true);
    }, []);

    useSubscribeFunction("openBatchInfoDialog", openBatchInfoDialog, []);

    const handleDialogAction = useCallback((data) => {
        DIALOG_BUTTONS[data]?.action();
    }, []);

    useSubscribeFunction(COMPONENT_NAME, handleDialogAction, []);

    const closeBatchInfoDialog = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    const DIALOG_BUTTONS = {
        Close: {
            label: t(`Close`),
            action: () => {
                closeBatchInfoDialog();
            },
        },
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Escape" && isDialogOpen) {
                closeBatchInfoDialog();
                e.stopPropagation();
            }
        };

        document.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, [isDialogOpen]);

    return (
        <Dialog
            title={t(`batchInfoDialog`)}
            initiator={COMPONENT_NAME}
            isOpen={isDialogOpen}
            onClose={closeBatchInfoDialog}
            closeOnOutsideClick={true}
            buttons={DIALOG_BUTTONS}
        >
            <div className="batch-info-dialog-content">
                {InfoCommands(t).map((group, index) => (
                    <div
                        className="batch-info-dialog-group"
                        key={group.title}
                        style={{ gridColumn: index % 2 === 0 ? "1" : "2" }}
                    >
                        <div className="batch-info-dialog-title">{group.title}</div>
                        {group.items.map((item, itemIndex) => (
                            <div
                                className="batch-info-dialog-item-container item"
                                key={`${group.title}-${itemIndex}`}
                            >
                                <div className="batch-info-dialog-item-container command">
                                    {item.command}
                                </div>
                                <div className="batch-info-dialog-item-container hotkeys">
                                    {item.hotkeys.map((hotkey, hotkeyIndex) => (
                                        <div
                                            className="batch-info-dialog-item-container hotkey"
                                            key={`${group.title}-${itemIndex}-${hotkeyIndex}`}
                                        >
                                            <SVGIcon icon={hotkey} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </Dialog>
    );
});
