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
    setInputValue(value || defaultValue || "");
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
      <TouchableOpacity onPress={decrement} testID="decrement-button">
        <Ionicons name="remove-circle-outline" size={24} color="#FFFFFF" />
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
      <TouchableOpacity onPress={increment} testID="increment-button">
        <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  numberInputContainer: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#293048",
    borderRadius: 5,
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  numberInput: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    flex: 1,
  },
});

export default NumberInput;