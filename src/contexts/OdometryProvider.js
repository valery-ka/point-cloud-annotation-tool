import { createContext, useContext, useState } from "react";

const OdometryContext = createContext();

export const OdometryProvider = ({ children }) => {
    const [odometry, setOdometry] = useState({});

    return (
        <OdometryContext.Provider
            value={{
                odometry,
                setOdometry,
            }}
        >
            {children}
        </OdometryContext.Provider>
    );
};

export const useOdometry = () => useContext(OdometryContext);
