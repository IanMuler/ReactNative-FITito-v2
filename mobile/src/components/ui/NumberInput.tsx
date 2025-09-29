import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type NumberInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  defaultValue?: string;
  testID?: string;
};

const NumberInput = ({
  value,
  onChangeText,
  placeholder,
  defaultValue,
  testID,
}: NumberInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    // Solo usar defaultValue si value es realmente undefined/null, no si es ""
    if (value !== undefined && value !== null) {
      setInputValue(value);
    } else if (defaultValue) {
      setInputValue(defaultValue);
    } else {
      setInputValue("");
    }
  }, [value, defaultValue]);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    onChangeText(text);
  };

  const increment = () => {
    const newValue = String(Number(inputValue) + 1);
    setInputValue(newValue);
    onChangeText(newValue);
  };

  const decrement = () => {
    const newValue = String(Math.max(0, Number(inputValue) - 1));
    setInputValue(newValue);
    onChangeText(newValue);
  };

  return (
    <View style={styles.numberInputContainer}>
      <TouchableOpacity
        onPress={decrement}
        testID="decrement-button"
        style={styles.decrementButton}
      >
        <Ionicons name="remove-circle-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <TextInput
        style={styles.numberInput}
        value={inputValue}
        keyboardType="numeric"
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A5A5A5"
        testID={testID}
      />

      <TouchableOpacity
        onPress={increment}
        testID="increment-button"
        style={styles.incrementButton}
      >
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  numberInputContainer: {
    flex: 1,
    height: 48,
    position: "relative",
    backgroundColor: "#293048",
    borderRadius: 8,
    justifyContent: "center",
  },
  decrementButton: {
    position: "absolute",
    left: 5,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  incrementButton: {
    position: "absolute",
    right: 5,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  numberInput: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    flex: 1,
    paddingHorizontal: 35,
  },
});

export default NumberInput;