import type { ReactNode } from "react";
import type { SesionAutenticada } from "./LoginMenu";

interface LoginInkScreenProps {
    onLoginSuccess: (sesion: SesionAutenticada) => void;
}

type ActiveField = "tarjeta" | "pin";

interface FieldProps {
    label: string;
    value: string;
    placeholder: string;
    isFocused: boolean;
    isPassword?: boolean;
}

interface ReactModule {
    createElement: typeof import("react").createElement;
    useState: typeof import("react").useState;
}

interface InkModule {
    Box: any;
    Text: any;
    useInput: any;
}

export function createLoginInkScreen(React: ReactModule, ink: InkModule) {
    const { Box, Text, useInput } = ink;

    const Card = ({ title, subtitle, children }: { title?: string; subtitle?: string; children?: ReactNode }) => {
        return React.createElement(
            Box,
            {
                flexDirection: "column",
                borderStyle: "round",
                borderColor: "cyan",
                paddingX: 2,
                paddingY: 1,
                width: 60
            },
            title ? React.createElement(
                Box,
                { flexDirection: "column", marginBottom: 1 },
                React.createElement(Text, { bold: true, color: "cyan" }, title),
                subtitle ? React.createElement(Text, { color: "gray" }, subtitle) : null
            ) : null,
            children
        );
    };

    const Alert = ({ title, children }: { title: string; children?: ReactNode }) => {
        return React.createElement(
            Box,
            {
                flexDirection: "column",
                borderStyle: "round",
                borderColor: "red",
                paddingX: 1,
                paddingY: 0,
                marginTop: 1
            },
            React.createElement(Text, { bold: true, color: "red" }, title),
            React.createElement(Text, null, children)
        );
    };

    const TextInput = ({ label, value, placeholder, isFocused, isPassword = false }: FieldProps) => {
        const displayValue = isPassword ? "●".repeat(value.length) : value;
        const safeValue = displayValue || placeholder;

        return React.createElement(
            Box,
            { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, null, label),
            React.createElement(
                Box,
                {
                    borderStyle: "round",
                    borderColor: isFocused ? "green" : "gray",
                    paddingX: 1,
                    paddingY: 0,
                    width: 40
                },
                React.createElement(Text, { color: value ? "white" : "gray" }, safeValue),
                isFocused ? React.createElement(Text, { color: "green" }, "█") : null
            )
        );
    };

    return function LoginInkScreen({ onLoginSuccess }: LoginInkScreenProps) {
        const [numeroTarjeta, setNumeroTarjeta] = React.useState("");
        const [pin, setPin] = React.useState("");
        const [activeField, setActiveField] = React.useState<ActiveField>("tarjeta");
        const [isSubmitting, setIsSubmitting] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);

        const handleSubmit = async () => {
            if (!numeroTarjeta.trim() || !pin.trim()) {
                setError("Completa ambos campos para continuar.");
                return;
            }

            setIsSubmitting(true);
            setError(null);

            const { autenticacionService } = await import("../../../../bootstrap/services");
            const { ResultadoOperacion } = await import("../../../../Application/models/Resultado");

            const resultado = await autenticacionService.autenticar(numeroTarjeta.trim(), pin.trim());

            if (!resultado.estado) {
                setIsSubmitting(false);
                setError(ResultadoOperacion.obtenerMensajeError(resultado));
                setPin("");
                setActiveField("pin");
                return;
            }

            onLoginSuccess({
                numeroTarjeta: resultado.valor.numeroTarjeta,
                numeroCuenta: resultado.valor.numeroCuenta,
                saldo: resultado.valor.saldo,
                nombre: resultado.valor.nombre
            });
        };

        useInput((input, key) => {
            if (isSubmitting) {
                return;
            }

            if (key.tab) {
                setActiveField((current) => (current === "tarjeta" ? "pin" : "tarjeta"));
                setError(null);
                return;
            }

            if (key.return) {
                if (activeField === "tarjeta") {
                    setActiveField("pin");
                    setError(null);
                    return;
                }

                void handleSubmit();
                return;
            }

            if (key.backspace || key.delete) {
                if (activeField === "tarjeta") {
                    setNumeroTarjeta((current) => current.slice(0, -1));
                } else {
                    setPin((current) => current.slice(0, -1));
                }
                setError(null);
                return;
            }

            if (key.escape) {
                setError(null);
                return;
            }

            if (input && input.length > 0 && !key.ctrl && !key.meta) {
                if (activeField === "tarjeta") {
                    setNumeroTarjeta((current) => current + input);
                } else {
                    setPin((current) => current + input);
                }
                setError(null);
            }
        });

        return React.createElement(
            Box,
            { flexDirection: "column", paddingX: 2, paddingY: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Cajero Automático"),
            React.createElement(Text, { color: "gray" }, "Ingrese sus credenciales para continuar."),
            React.createElement(
                Box,
                { marginTop: 1 },
                React.createElement(
                    Card,
                    { title: "Inicio de sesión", subtitle: "Use Tab para cambiar de campo y Enter para continuar." },
                    React.createElement(TextInput, {
                        label: "Número de tarjeta",
                        value: numeroTarjeta,
                        placeholder: "0000 0000 0000 0000",
                        isFocused: activeField === "tarjeta"
                    }),
                    React.createElement(TextInput, {
                        label: "PIN",
                        value: pin,
                        placeholder: "••••",
                        isFocused: activeField === "pin",
                        isPassword: true
                    }),
                    isSubmitting ? React.createElement(Text, { color: "yellow" }, "Autenticando...") : null,
                    error ? React.createElement(Alert, { title: "Error de autenticación" }, error) : null
                )
            )
        );
    };
}

