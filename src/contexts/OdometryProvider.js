import { createContext, useContext, useState } from "react";

const OdometryContext = createContext();

export const OdometryProvider = ({ children }) => {
    const [odometry, setOdometry] = useState({});
    const [isOdometryProcessed, setIsOdometryProcessed] = useState(false);

    return (
        <OdometryContext.Provider
            value={{
                odometry,
                setOdometry,
                isOdometryProcessed,
                setIsOdometryProcessed,
            }}
        >
            {children}
        </OdometryContext.Provider>
    );
};

export const useOdometry = () => useContext(OdometryContext);
