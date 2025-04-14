import { useEffect, useRef } from "react";

export const useWhyUpdate = (props, label = "WhyUpdate") => {
    const prevProps = useRef(props);

    useEffect(() => {
        const changedProps = Object.entries(props).reduce((acc, [key, value]) => {
            if (prevProps.current[key] !== value) {
                acc[key] = {
                    from: prevProps.current[key],
                    to: value,
                };
            }
            return acc;
        }, {});

        if (Object.keys(changedProps).length > 0) {
            console.groupCollapsed(`[${label}] props has been chagned`);
            console.table(changedProps);
            console.groupEnd();
        }

        prevProps.current = props;
    });
};
