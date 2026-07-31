import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const ICON_SIZE  = 110;
const FONT_SIZE  = 44;
const GAP        = 14;
const TEXT_W     = 112;
const GROUP_W    = ICON_SIZE + GAP + TEXT_W;
const ICON_SHIFT = GROUP_W / 2 - ICON_SIZE / 2;

// Scale needed for the bloom circle (simple View — cheap to render)
const COVER_SCALE = Math.ceil(Math.sqrt(W * W + H * H) / ICON_SIZE) + 2;

export default function SplashView({ onReady }) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const iconScale      = useRef(new Animated.Value(0)).current;
  const groupX         = useRef(new Animated.Value(ICON_SHIFT)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const bloomScale     = useRef(new Animated.Value(0)).current;
  const animDone       = useRef(false);
  const authDone       = useRef(false);

  useEffect(() => {
    Animated.sequence([
      // 1. Blossom pops in
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 190,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.delay(280),

      // 2. Group slides left + "Luna" fades in
      Animated.parallel([
        Animated.spring(groupX, {
          toValue: 0,
          tension: 130,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),

      // 3. "Luna" fades out + blossom re-centers
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(groupX, {
          toValue: ICON_SHIFT,
          tension: 130,
          friction: 12,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(260),

      // 4. Solid circle blooms from center — lightweight, no lag
      Animated.timing(bloomScale, {
        toValue: COVER_SCALE,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animDone.current = true;
      tryFadeOut();
    });
  }, []);

  function tryFadeOut() {
    if (!animDone.current || !authDone.current) return;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => onReady?.());
  }

  SplashView.hide = () => {
    authDone.current = true;
    tryFadeOut();
  };

  return (
    <Animated.View style={[s.root, { opacity: overlayOpacity }]} pointerEvents="none">
      <LinearGradient
        colors={['#fce4ec', '#f48fb1', '#e75480']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Blossom + name */}
      <Animated.View style={[s.row, { transform: [{ translateX: groupX }] }]}>
        <Animated.Text style={[s.blossom, { transform: [{ scale: iconScale }] }]}>
          🌸
        </Animated.Text>
        <Animated.Text style={[s.name, { opacity: textOpacity }]}>
          Luna
        </Animated.Text>
      </Animated.View>

      {/* Bloom circle — solid View is GPU-accelerated, no freeze */}
      <Animated.View
        style={[s.bloomCircle, { transform: [{ scale: bloomScale }] }]}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: GROUP_W,
  },
  blossom: {
    fontSize: ICON_SIZE,
    width: ICON_SIZE,
    textAlign: 'center',
  },
  name: {
    fontSize: FONT_SIZE,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginLeft: GAP,
    width: TEXT_W,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bloomCircle: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#e75480',
    left: W / 2 - ICON_SIZE / 2,
    top:  H / 2 - ICON_SIZE / 2,
  },
});
