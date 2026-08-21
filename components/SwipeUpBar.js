import { useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Platform } from 'react-native';
import { fontFamily } from '../theme/typography';

const SWIPE_DIST = 55;   // px upward to trigger
const SWIPE_VEL  = 0.35; // velocity threshold (negative = up)
const TAP_SLOP   = 12;   // px — treat as tap if barely moved

export default function SwipeUpBar({
  onSwipe,
  label    = 'Swipe up to submit',
  color    = '#e75480',
  disabled = false,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const arrowScale = useRef(new Animated.Value(1)).current;

  // Keep latest values in refs so PanResponder closures always see them
  const disabledRef = useRef(disabled);
  const onSwipeRef  = useRef(onSwipe);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { onSwipeRef.current  = onSwipe;  }, [onSwipe]);

  // Fire: animate up then spring back, then call the handler
  const fire = useRef(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(translateY, { toValue: -90, duration: 200, useNativeDriver: true }),
        Animated.spring(arrowScale, { toValue: 1.5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,   useNativeDriver: true, tension: 70 }),
        Animated.spring(arrowScale, { toValue: 1,   useNativeDriver: true }),
      ]),
    ]).start();
    onSwipeRef.current();
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder:  (_, gs) => !disabledRef.current && gs.dy < -5,

      onPanResponderMove: (_, gs) => {
        if (gs.dy < 0) translateY.setValue(Math.max(gs.dy * 0.4, -90));
      },

      onPanResponderRelease: (_, gs) => {
        if (disabledRef.current) return;

        const isTap   = Math.abs(gs.dx) < TAP_SLOP && Math.abs(gs.dy) < TAP_SLOP;
        const isSwipe = gs.dy < -SWIPE_DIST || gs.vy < -SWIPE_VEL;

        if (isTap || isSwipe) {
          fire();
        } else {
          // snap back if not enough gesture
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        s.wrap,
        { transform: [{ translateY }], opacity: disabled ? 0.38 : 1 },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[s.pill, { backgroundColor: color }]} />
      <View style={s.row}>
        <Animated.Text style={[s.arrow, { color, transform: [{ scale: arrowScale }] }]}>
          ↑
        </Animated.Text>
        <Text style={[s.label, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
  },
  pill: { width: 32, height: 3, borderRadius: 1.5, opacity: 0.3, marginBottom: 5 },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: { fontSize: 14, fontFamily: fontFamily.bold, lineHeight: 16 },
  label: {
    fontSize: 10, fontFamily: fontFamily.bold, opacity: 0.75,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
});
