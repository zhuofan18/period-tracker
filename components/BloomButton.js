import { useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

export default function BloomButton({ onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const bloom = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.45,
        tension: 260,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={bloom} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={1}>
      <Animated.Text style={[s.icon, style, { transform: [{ scale }] }]}>
        🌸
      </Animated.Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  icon: { fontSize: 26 },
});
