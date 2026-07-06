import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Path, Pattern } from 'react-native-svg';
import { C } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
    };
    
    // Slow, ambient movement
    createLoop(anim1, 15000);
    createLoop(anim2, 22000);
    createLoop(anim3, 18000);
  }, []);

  // Orb 1 moves from top-left to slightly right
  const translate1X = anim1.interpolate({ inputRange: [0, 1], outputRange: [-100, 150] });
  const translate1Y = anim1.interpolate({ inputRange: [0, 1], outputRange: [-50, 200] });

  // Orb 2 moves from bottom-right up
  const translate2X = anim2.interpolate({ inputRange: [0, 1], outputRange: [width - 250, width - 400] });
  const translate2Y = anim2.interpolate({ inputRange: [0, 1], outputRange: [height - 200, height - 450] });

  // Orb 3 floats around the center
  const translate3X = anim3.interpolate({ inputRange: [0, 1], outputRange: [width / 2 - 250, width / 2 - 50] });
  const translate3Y = anim3.interpolate({ inputRange: [0, 1], outputRange: [height / 2 - 100, height / 2 - 300] });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base Gradient & Grid */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.bg} stopOpacity="1" />
            <Stop offset="1" stopColor={C.surface3} stopOpacity="1" />
          </LinearGradient>
          
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.border} strokeWidth="1" strokeOpacity="0.4" />
          </Pattern>
        </Defs>

        <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      {/* Animated Orbs */}
      <Animated.View style={[ss.orbContainer, { transform: [{ translateX: translate1X }, { translateY: translate1Y }] }]}>
        <Svg width={500} height={500}>
          <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={C.primary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={C.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={250} cy={250} r={250} fill="url(#grad1)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[ss.orbContainer, { transform: [{ translateX: translate2X }, { translateY: translate2Y }] }]}>
        <Svg width={600} height={600}>
          <Defs>
            <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={C.blue} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={C.blue} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={300} cy={300} r={300} fill="url(#grad2)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[ss.orbContainer, { transform: [{ translateX: translate3X }, { translateY: translate3Y }] }]}>
        <Svg width={450} height={450}>
          <Defs>
            <RadialGradient id="grad3" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={C.purple} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={C.purple} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={225} cy={225} r={225} fill="url(#grad3)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  orbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  }
});
