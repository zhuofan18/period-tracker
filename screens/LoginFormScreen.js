import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoginFormScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');

  const canLogin = email.trim().length > 0 && password.length >= 6;

  const handleLogin = () => {
    if (!canLogin) { setError('Please enter your email and password.'); return; }
    setError('');
    navigation.navigate('MainApp');
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.header}>Welcome back</Text>
        <Text style={s.sub}>Log in to your account</Text>

        <Text style={s.label}>Email Address</Text>
        <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={theme.placeholder} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={(v) => { setEmail(v); setError(''); }} />

        <Text style={s.label}>Password</Text>
        <View style={s.passwordWrapper}>
          <TextInput style={s.passwordInput} placeholder="Enter your password" placeholderTextColor={theme.placeholder} secureTextEntry={!showPassword} value={password} onChangeText={(v) => { setPassword(v); setError(''); }} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
            <Text style={s.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[s.loginBtn, !canLogin && s.loginBtnDisabled]} onPress={handleLogin} disabled={!canLogin}>
          <Text style={s.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <View style={s.signupRow}>
          <Text style={s.signupPrompt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backArrow: { fontSize: 22, color: theme.text },
  header: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
  sub: { fontSize: 14, color: theme.muted, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 20 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 10, backgroundColor: theme.inputBg },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 18 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  errorText: { color: '#e74c3c', fontSize: 13, marginBottom: 12 },
  loginBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled: { backgroundColor: '#f2b8cc' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt: { fontSize: 14, color: theme.subtext },
  signupLink: { fontSize: 14, color: theme.primary, fontWeight: '600' },
});
