// Manrope — soft, rounded, calm. Loaded via @expo-google-fonts/manrope in App.js.
export const fontFamily = {
  regular:   'Manrope_400Regular',
  medium:    'Manrope_500Medium',
  semibold:  'Manrope_600SemiBold',
  bold:      'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

// Named type styles — spread these into component styles instead of
// hand-picking fontSize/fontWeight per element.
export const type = {
  display:    { fontFamily: fontFamily.extrabold, fontSize: 44, lineHeight: 50, letterSpacing: -0.8 },
  h1:         { fontFamily: fontFamily.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h2:         { fontFamily: fontFamily.bold,      fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  h3:         { fontFamily: fontFamily.bold,      fontSize: 15, lineHeight: 20 },
  body:       { fontFamily: fontFamily.regular,   fontSize: 14, lineHeight: 21 },
  bodyMedium: { fontFamily: fontFamily.medium,    fontSize: 14, lineHeight: 21 },
  small:      { fontFamily: fontFamily.medium,    fontSize: 12, lineHeight: 17 },
  caption:    { fontFamily: fontFamily.medium,    fontSize: 11, lineHeight: 15, letterSpacing: 0.1 },
  label:      { fontFamily: fontFamily.semibold,  fontSize: 12, lineHeight: 15, letterSpacing: 0.3 },
};
