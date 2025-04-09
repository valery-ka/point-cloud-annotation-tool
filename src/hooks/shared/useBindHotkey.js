import { useEffect } from "react";
import Mousetrap from "mousetrap";

export const useBindHotkey = (hotkey, callback) => {
    useEffect(() => {
        if (hotkey) {
            Mousetrap.bind(hotkey, (e) => {
                e.preventDefault();
                callback(e);
            });
            // console.log("bind", hotkey);
        }

        return () => {
            if (hotkey) {
                Mousetrap.unbind(hotkey);
                // console.log("unbind", hotkey);
            }
        };
    }, [hotkey, callback]);
};
