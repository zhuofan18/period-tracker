import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontFamily } from '../theme/typography';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <View style={s.screen}>
      <View style={s.hero}>
        <Text style={s.logo}>🌸</Text>
        <Text style={s.appName}>Luna</Text>
        <Text style={s.tagline}>Your personal cycle companion</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.navigate('CreateAccount')}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('LoginForm')}
          activeOpacity={0.85}
        >
          <Text style={s.secondaryBtnText}>Log In</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 80 : 100,
    paddingBottom: Platform.OS === 'android' ? 40 : 54,
    paddingHorizontal: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 72,
    marginBottom: 4,
  },
  appName: {
    fontSize: 40,
    fontFamily: fontFamily.extrabold,
    color: theme.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: theme.muted,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  secondaryBtnText: {
    color: theme.primary,
    fontSize: 16,
    fontFamily: fontFamily.bold,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
