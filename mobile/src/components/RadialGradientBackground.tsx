import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

const RadialGradientBackground = () => {
  const rx = 100;
  const ry = rx / 1.9;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%" preserveAspectRatio="xMinYMin slice">
        <Defs>
          <RadialGradient
            id="grad"
            cx="0%"
            cy="0%"
            rx={`${rx}%`}
            ry={`${ry}%`}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#373C56" stopOpacity="1" />
            <Stop offset="100%" stopColor="#121623" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

export default RadialGradientBackground;