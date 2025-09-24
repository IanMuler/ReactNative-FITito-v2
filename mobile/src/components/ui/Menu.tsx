import React, { useState, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text } from 'react-native';

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
}

interface MenuItemProps {
  text: string;
  onPress: () => void;
  testID?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({ text, onPress, testID }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} testID={testID}>
      <Text style={styles.menuItemText}>{text}</Text>
    </TouchableOpacity>
  );
};

const Menu: React.FC<MenuProps> = ({ trigger, children }) => {
  const [visible, setVisible] = useState(false);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        {trigger}
      </TouchableOpacity>
      
      <Modal
        transparent
        visible={visible}
        onRequestClose={handleClose}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <View style={styles.menu}>
            {React.Children.map(children, (child) => 
              React.cloneElement(child as React.ReactElement, {
                onPress: () => {
                  (child as any).props.onPress();
                  handleClose();
                }
              } as any)
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#1F2940',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default Menu;