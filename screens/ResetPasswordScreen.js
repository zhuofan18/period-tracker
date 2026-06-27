import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ResetPasswordScreen({ navigation, route }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const email = route?.params?.email ?? '';
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState('');
  const [done, setDone]                       = useState(false);

  const canSubmit = password.length >= 6 && confirmPassword.length > 0;

  const handleReset = () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setDone(true);
  };

  if (done) {
    return (
      <View style={s.screen}>
        <View style={s.successContainer}>
          <Text style={s.successIcon}>✅</Text>
          <Text style={s.successTitle}>Password Updated!</Text>
          <Text style={s.successSub}>Your password has been changed successfully. You can now log in with your new password.</Text>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('LoginForm')}>
            <Text style={s.loginBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.header}>Set New Password</Text>
        <Text style={s.sub}>{email ? <>Creating a new password for <Text style={s.emailHighlight}>{email}</Text></> : 'Choose a strong new password for your account.'}</Text>

        <Text style={s.label}>New Password</Text>
        <View style={s.passwordWrapper}>
          <TextInput style={s.passwordInput} placeholder="At least 6 characters" placeholderTextColor={theme.placeholder} secureTextEntry={!showPassword} value={password} onChangeText={(v) => { setPassword(v); setError(''); }} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
            <Text>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Confirm New Password</Text>
        <TextInput style={s.input} placeholder="Re-enter your new password" placeholderTextColor={theme.placeholder} secureTextEntry={!showPassword} value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setError(''); }} />

        {password.length > 0 && (
          <View style={s.strengthRow}>
            <View style={[s.strengthBar, { backgroundColor: password.length >= 10 ? '#22c55e' : password.length >= 6 ? '#fb923c' : '#ef4444' }]} />
            <Text style={s.strengthLabel}>{password.length >= 10 ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'}</Text>
          </View>
        )}

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]} onPress={handleReset} disabled={!canSubmit}>
          <Text style={s.submitBtnText}>Update Password</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56 },
  backBtn: { marginBottom: 24 },
  backArrow: { fontSize: 22, color: theme.text },
  header: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.muted, marginBottom: 32, lineHeight: 21 },
  emailHighlight: { color: theme.primary, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 20 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 20, backgroundColor: theme.inputBg },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn: { padding: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: -10 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 12, color: theme.muted, width: 50 },
  errorText: { color: '#e74c3c', fontSize: 13, marginBottom: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { backgroundColor: '#f2b8cc' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successIcon: { fontSize: 64, marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  successSub: { fontSize: 15, color: theme.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  loginBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, paddingHorizontal: 48, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
