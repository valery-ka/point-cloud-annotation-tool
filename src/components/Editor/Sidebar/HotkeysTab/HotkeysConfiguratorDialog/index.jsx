import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSettings, useConfig } from "@contexts";
import { useSubscribeFunction } from "@hooks";

import { Dialog } from "@components";

import {
    keyCodes,
    defaultHotkeys,
    generateClassHotkeys,
    getTranslatedCommand,
} from "@utils/settings";

// const COMPONENT_NAME = "HotkeyConfiguratorDialog.";
const COMPONENT_NAME = "";
const EMPTY_KEY = "---";

export const HotkeyConfiguratorDialog = () => {
    const { t } = useTranslation();

    const { nonHiddenClasses } = useConfig();

    const { settings, updateHotkeys } = useSettings();
    const { hotkeys } = settings;

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [newHotkeys, setNewHotkeys] = useState({});
    const [cancelNewHotkeys, setCancelNewHotkeys] = useState({});

    const [newKeyCombo, setNewKeyCombo] = useState("");
    const [prevKeyCombo, setPrevKeyCombo] = useState("");

    const openConfigurator = useCallback(() => {
        setNewHotkeys(hotkeys);
        setCancelNewHotkeys(hotkeys);
        setIsDialogOpen(true);
    }, [hotkeys]);

    useSubscribeFunction("openHotkeyConfigurator", openConfigurator, [hotkeys]);

    const handleDialogAction = useCallback(
        (data) => DIALOG_BUTTONS[data]?.action(),
        [newHotkeys, cancelNewHotkeys],
    );

    useSubscribeFunction(COMPONENT_NAME, handleDialogAction, [newHotkeys, cancelNewHotkeys]);

    const handleInputFieldKeyDown = useCallback(
        (e, category, command) => {
            e.preventDefault();

            setNewKeyCombo((prevCombo) => {
                const key = e.keyCode;
                const keyChar = keyCodes()[key] || "";
                const comboParts = prevCombo.split("+");
                const specialEvents = ["esc", "enter", "backspace", "delete"];

                const updateCommandHotkey = (value) => {
                    setNewHotkeys((prev) => ({
                        ...prev,
                        [category]: {
                            ...prev[category],
                            [command]: value,
                        },
                    }));
                    return value;
                };

                if (specialEvents.includes(keyChar)) {
                    if (keyChar === "enter") {
                        e.target.blur();
                    } else if (keyChar === "esc") {
                        e.target.blur();
                        return updateCommandHotkey(prevKeyCombo);
                    } else {
                        return updateCommandHotkey(EMPTY_KEY);
                    }
                    return EMPTY_KEY;
                }

                if (!comboParts.includes(keyChar) && comboParts.length < 3) {
                    const newCombo = prevCombo ? `${prevCombo}+${keyChar}` : keyChar;
                    return updateCommandHotkey(newCombo);
                }

                return prevCombo;
            });
        },
        [prevKeyCombo],
    );

    const handleInputFieldFocus = useCallback(
        (category, command) => {
            if (newHotkeys[category][command].length) {
                setPrevKeyCombo(newHotkeys[category][command]);
            }

            setNewKeyCombo("");

            setNewHotkeys((prev) => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [command]: "",
                },
            }));
        },
        [newHotkeys],
    );

    const handleInputFieldBlur = useCallback(
        (category, command) => {
            setNewHotkeys((prev) => {
                let newState = {
                    ...prev,
                    [category]: {
                        ...prev[category],
                        [command]: newKeyCombo.length ? newKeyCombo : prevKeyCombo,
                    },
                };

                const allEntries = Object.entries(newState).flatMap(([cat, categoryObj]) =>
                    Object.entries(categoryObj)
                        .filter(([, value]) => value !== EMPTY_KEY)
                        .map(([key, value]) => ({
                            category: cat,
                            command: key,
                            value,
                        })),
                );

                const valueMap = allEntries.reduce((acc, { category, command, value }) => {
                    if (!acc[value]) acc[value] = [];
                    acc[value].push({ category, command });
                    return acc;
                }, {});

                Object.entries(valueMap).forEach(([value, entries]) => {
                    if (entries.length > 1) {
                        entries.forEach(({ category: ctg, command: cmd }) => {
                            if (cmd !== command) {
                                newState[ctg][cmd] = EMPTY_KEY;
                            }
                        });
                    }
                });

                return newState;
            });
        },
        [newKeyCombo, prevKeyCombo],
    );

    const getHotkey = useCallback(
        (category, command) => newHotkeys[category]?.[command],
        [newHotkeys],
    );

    const DIALOG_BUTTONS = {
        OK: {
            label: t(`${COMPONENT_NAME}OK`),
            action: () => {
                updateHotkeys(newHotkeys);
                resetState();
            },
        },
        Reset: {
            label: t(`${COMPONENT_NAME}reset`),
            action: () => {
                setNewHotkeys(generateClassHotkeys(defaultHotkeys, nonHiddenClasses));
            },
        },
        Clear: {
            label: t(`${COMPONENT_NAME}clear`),
            action: () => {
                setNewHotkeys((prevHotkeys) => clearHotkeys(prevHotkeys));
            },
        },
        Cancel: {
            label: t(`${COMPONENT_NAME}cancel`),
            action: () => {
                updateHotkeys(cancelNewHotkeys);
                resetState();
            },
        },
    };

    const resetState = useCallback(() => {
        setNewHotkeys({});
        setCancelNewHotkeys({});
        setIsDialogOpen(false);
    }, []);

    const clearHotkeys = useCallback(
        (obj) =>
            Object.fromEntries(
                Object.keys(obj).map((key) => [
                    key,
                    typeof obj[key] === "object" ? clearHotkeys(obj[key]) : EMPTY_KEY,
                ]),
            ),
        [],
    );

    return (
        <Dialog
            isOpen={isDialogOpen}
            title={t(`${COMPONENT_NAME}configureHotkeys`)}
            size="medium"
            initiator={COMPONENT_NAME}
            buttons={DIALOG_BUTTONS}
        >
            <div className="hotkey-configurator-content">
                {Object.entries(hotkeys)
                    .filter(([category]) => category !== "fixed")
                    .map(([category, commands], index) => (
                        <div
                            key={category}
                            className="hotkey-configurator-group"
                            style={{ gridColumn: index % 2 === 0 ? "1" : "2" }}
                        >
                            <div className="hotkey-configurator-title">
                                {t(`${COMPONENT_NAME}${category}`)}
                            </div>
                            {Object.entries(commands).map(([command, hotkey]) => (
                                <div
                                    key={command}
                                    className="hotkey-configurator-item-container item"
                                >
                                    <div className="hotkey-configurator-item-container command">
                                        {getTranslatedCommand(command, nonHiddenClasses, t)}
                                    </div>
                                    <input
                                        className="hotkey-configurator-item-container hotkey"
                                        type="text"
                                        value={getHotkey(category, command)}
                                        onFocus={() => handleInputFieldFocus(category, command)}
                                        onBlur={() => handleInputFieldBlur(category, command)}
                                        onKeyDown={(e) =>
                                            handleInputFieldKeyDown(e, category, command)
                                        }
                                        readOnly
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
            </div>
        </Dialog>
    );
};
