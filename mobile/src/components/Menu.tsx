// components/Menu.tsx
import React, { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import {
    View,
    Pressable,
    StyleSheet,
    Platform,
    TouchableOpacity,
    Text,
    Dimensions,
    Keyboard,
    LayoutRectangle,
    StatusBar,
    Animated,
} from "react-native";
import { Portal } from "@gorhom/portal";

const { height: layoutHeight } = Dimensions.get("window");

const useKeyboardHeight = () => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const handleKeyboardDidShow = (e: any) => {
            setKeyboardHeight(e.endCoordinates.height);
        };

        const handleKeyboardDidHide = () => {
            setKeyboardHeight(0);
        };

        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSubscription = Keyboard.addListener(showEvent, handleKeyboardDidShow);
        const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardDidHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return { keyboardHeight };
};

type MenuProps = {
    trigger: ReactNode;
    children: ReactNode | ReactNode[];
};

type MenuItemProps = {
    text: string;
    onPress: () => void;
    closeModal?: () => void;
    testID?: string;
};

const Menu = ({ trigger, children }: MenuProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [triggerDimensions, setTriggerDimensions] = useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
    const [modalDimensions, setModalDimensions] = useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
    const triggerWrapperRef = useRef<View>(null);
    const itemsWrapperRef = useRef<View>(null);
    const { keyboardHeight } = useKeyboardHeight();

    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (modalVisible) {
            calculateDimensions();
        } else {
            resetAnimation();
        }
    }, [modalVisible]);

    useEffect(() => {
        if (modalDimensions.width && triggerDimensions.x) {
            startAnimation();
        }
    }, [modalDimensions, triggerDimensions]);

    const styles = StyleSheet.create({
        modalWrapper: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 10,
            backgroundColor: "transparent", // Eliminar el fondo del modal
        },
        activeSection: {
            backgroundColor: "#1F2940",
            alignSelf: "flex-start",
            borderRadius: 10,
            padding: 10,
            zIndex: 99,
            opacity: modalDimensions.width !== 0 && triggerDimensions.x !== 0 ? 1 : 0,
        },
        option: {
            padding: 10,
        },
        optionText: {
            color: "#FFFFFF",
            fontSize: 16,
        },
    });

    const closeModal = () => {
        setModalVisible(false);
    };

    const calculateDimensions = () => {
        triggerWrapperRef?.current?.measureInWindow((x, y, width, height) => {
            setTriggerDimensions({
                x,
                y,
                width,
                height,
            });
        });

        setTimeout(() => {
            itemsWrapperRef?.current?.measureInWindow((x, y, width, height) => {
                setModalDimensions({ x, y, width, height });
            });
        }, 0); // Reducir el tiempo de espera para calcular las dimensiones más rápido
    };

    const resetAnimation = () => {
        opacity.setValue(0);
        scale.setValue(0.9);
    };

    const startAnimation = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 100, // Reducir la duración de la animación
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const { top, left } = useMemo(() => {
        let left = 0;
        let top = 0;

        left = triggerDimensions.x - modalDimensions.width + triggerDimensions.width;
        if (triggerDimensions.x - modalDimensions.width < 0)
            left = triggerDimensions.x;

        if (Platform.OS === "ios") {
            const initialTriggerTop = triggerDimensions.y + triggerDimensions.height + 10;
            if (modalDimensions.height + initialTriggerTop > layoutHeight - keyboardHeight)
                top = triggerDimensions.y - modalDimensions.height - 10;
            else top = initialTriggerTop;
        } else {
            const initialTriggerTop = triggerDimensions.y + triggerDimensions.height + (StatusBar.currentHeight || 0);
            top = initialTriggerTop + modalDimensions.height > layoutHeight - keyboardHeight
                ? initialTriggerTop - triggerDimensions.height - modalDimensions.height
                : initialTriggerTop;
        }

        return { top: top - 20, left: left - 30 };
    }, [modalDimensions, triggerDimensions, keyboardHeight]);

    const menuPositionStyles = { left, top };

    return (
        <>
            <Pressable
                onPress={() => setModalVisible(true)}
                ref={triggerWrapperRef}
            >
                {trigger}
            </Pressable>
            {modalVisible && (
                <Portal>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={closeModal}
                        style={styles.modalWrapper}
                        testID="outside-area"
                    >
                        <Animated.View
                            ref={itemsWrapperRef}
                            style={[styles.activeSection, menuPositionStyles, { opacity, transform: [{ scale }] }]}
                            collapsable={false}
                        >
                            {Array.isArray(children)
                                ? children.map((childrenItem, index) => {
                                    return React.cloneElement(childrenItem as React.ReactElement, {
                                        key: index,
                                        closeModal,
                                    } as any);
                                })
                                : React.cloneElement(children as React.ReactElement, {
                                    closeModal,
                                } as any)}
                        </Animated.View>
                    </TouchableOpacity>
                </Portal>
            )}
        </>
    );
};

export const MenuItem = ({ text, onPress, closeModal, testID }: MenuItemProps) => {
    const styles = StyleSheet.create({
        body: {
            padding: 10,
        },
        optionText: {
            color: "#FFFFFF",
            fontSize: 16,
        },
    });

    const handleOnPress = () => {
        onPress();
        closeModal?.();
    };

    return (
        <Pressable onPress={handleOnPress} style={styles.body} testID={testID}>
            <Text style={styles.optionText} numberOfLines={1}>{text}</Text>
        </Pressable >
    );
};

export default Menu;