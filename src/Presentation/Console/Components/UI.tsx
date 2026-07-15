import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

// --- TEXT INPUT COMPONENT ---
interface TextInputProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    mask?: string;
    isActive: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder = '',
    mask,
    isActive,
}) => {
    const [cursor, setCursor] = useState(true);

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setCursor((c) => !c);
        }, 500);
        return () => clearInterval(interval);
    }, [isActive]);

    useInput((input, key) => {
        if (!isActive) return;

        if (key.return) {
            onSubmit();
            return;
        }

        if (key.backspace) {
            onChange(value.slice(0, -1));
            return;
        }

        if (input && !key.ctrl && !key.meta && !key.escape) {
            // Permitir solo números y letras básicas
            onChange(value + input);
        }
    });

    const displayValue = mask ? mask.repeat(value.length) : value;

    return (
        <Box borderStyle="round" borderColor={isActive ? 'cyan' : 'gray'} paddingX={1}>
            {value.length === 0 ? (
                <Text color="gray">{placeholder}</Text>
            ) : (
                <Text color="white">{displayValue}</Text>
            )}
            {isActive && cursor && <Text color="cyan">█</Text>}
        </Box>
    );
};

// --- SELECT INPUT COMPONENT ---
interface SelectOption {
    label: string;
    value: string;
}

interface SelectInputProps {
    options: SelectOption[];
    onSelect: (value: string) => void;
    isActive: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
    options,
    onSelect,
    isActive,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useInput((input, key) => {
        if (!isActive) return;

        if (key.upArrow) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }

        if (key.downArrow) {
            setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }

        if (key.return) {
            onSelect(options[selectedIndex]!.value);
        }
    });

    return (
        <Box flexDirection="column" gap={0}>
            {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <Box key={`${option.value}-${index}`} paddingLeft={1}>
                        <Text color={isSelected ? 'magenta' : 'white'} bold={isSelected}>
                            {isSelected ? '❯ ' : '  '}
                            {option.label}
                        </Text>
                    </Box>
                );
            })}
        </Box>
    );
};

// --- CARD / FRAME COMPONENT ---
interface CardProps {
    title?: string;
    children: React.ReactNode;
    borderColor?: string;
}

export const Card: React.FC<CardProps> = ({
    title,
    children,
    borderColor = 'cyan',
}) => {
    return (
        <Box
            flexDirection="column"
            borderStyle="single"
            borderColor={borderColor}
            paddingX={2}
            paddingY={1}
            minWidth={50}
        >
            {title && (
                <Box justifyContent="center" marginBottom={1}>
                    <Text color="yellow" bold underline>
                        {title.toUpperCase()}
                    </Text>
                </Box>
            )}
            {children}
        </Box>
    );
};

// --- SPINNER / LOADING COMPONENT ---
export const Spinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => {
    const [frame, setFrame] = useState(0);
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((f) => (f + 1) % frames.length);
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box flexDirection="row" gap={1} marginY={1}>
            <Text color="yellow">{frames[frame]}</Text>
            <Text color="gray">{message}</Text>
        </Box>
    );
};
