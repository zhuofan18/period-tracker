import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function FadeInView({ children, style, duration = 220 }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  return (
    <Animated.View style={[{ flex: 1, opacity }, style]}>
      {children}
    </Animated.View>
  );
}
