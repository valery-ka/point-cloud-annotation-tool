import React from "react";
import { withTranslation } from "react-i18next";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("Error Boundary Caught an Error:", error, errorInfo);
    }

    getErrorStackLines = () => {
        if (!this.state.error || !this.state.error.stack) return [];

        return this.state.error.stack
            .split("\n")
            .slice(1, 6)
            .map((line) => line.trim())
            .filter(Boolean);
    };

    render() {
        const { t } = this.props;

        if (this.state.hasError) {
            const stackLines = this.getErrorStackLines();

            const emoji = "(╯°□°）╯︵";
            const normalTable = "┳━┳";
            const upsideDownTable = " ┻━┻"; // intended space

            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-emoji">
                            <div className="glitch" data-text={`${emoji}${normalTable}`}>
                                {emoji}
                                {upsideDownTable}
                            </div>
                        </div>
                        <div className="error-boundary-text">{t("BSOD")}</div>
                        <div className="error-boundary-error-details">
                            {this.state.error.toString()}
                        </div>
                        {stackLines.length > 0 && (
                            <div className="error-boundary-error-lines">
                                {stackLines.map((line, index) => (
                                    <div key={index} className="error-boundary-error-line">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default withTranslation()(ErrorBoundary);
