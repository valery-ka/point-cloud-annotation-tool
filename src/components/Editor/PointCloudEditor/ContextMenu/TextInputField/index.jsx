import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";

export const TextInputField = ({ resetContextMenu, setIsTextInputOpened, addIssue }) => {
    const { t } = useTranslation();
    const { register, handleSubmit } = useForm();

    const inputRef = useRef(null);

    const handleClickOK = useCallback((data) => {
        const text = data.text;
        if (!text) return;

        const issue = { value: "OTHER", workerHint: text };

        addIssue(issue);
        setIsTextInputOpened(false);
        resetContextMenu();
    }, []);

    const handleClickCancel = useCallback(() => {
        setIsTextInputOpened(false);
        resetContextMenu();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    return (
        <form
            className="editor-text-input-container"
            onSubmit={handleSubmit(handleClickOK)}
            autoComplete="off"
        >
            <div className="editor-text-input-title">{t("typeIssue")}</div>
            <input
                type="text"
                className="editor-text-input-input"
                placeholder={t("describeIssue")}
                autoComplete="off"
                {...register("text")}
                ref={(e) => {
                    register("text").ref(e);
                    inputRef.current = e;
                }}
            />
            <div className="editor-text-input-buttons">
                <button className="editor-text-input-button" type="submit">
                    {t("OK")}
                </button>
                <button
                    className="editor-text-input-button"
                    type="button"
                    onClick={handleClickCancel}
                >
                    {t("cancel")}
                </button>
            </div>
        </form>
    );
};
