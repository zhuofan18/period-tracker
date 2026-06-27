import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const canSubmit = email.trim().length > 0 && email.includes('@');

  if (submitted) {
    return (
      <View style={s.screen}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { padding: 20 }]}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.confirmContainer}>
          <Text style={s.confirmIcon}>📬</Text>
          <Text style={s.confirmTitle}>Check your email</Text>
          <Text style={s.confirmSub}>
            We've sent a password reset link to{'\n'}
            <Text style={s.confirmEmail}>{email}</Text>
          </Text>
          <Text style={s.confirmNote}>Didn't receive it? Check your spam folder or try again.</Text>
          <TouchableOpacity style={s.resendBtn} onPress={() => setSubmitted(false)}>
            <Text style={s.resendBtnText}>Try a different email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.resetBtn} onPress={() => navigation.navigate('ResetPassword', { email })}>
            <Text style={s.resetBtnText}>Set New Password</Text>
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
        <Text style={s.header}>Forgot Password?</Text>
        <Text style={s.sub}>Enter the email address linked to your account and we'll send you a reset link.</Text>
        <Text style={s.label}>Email Address</Text>
        <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={theme.placeholder} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        {error ? <Text style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}
        <TouchableOpacity
          style={[s.submitBtn, (!canSubmit || loading) && s.submitBtnDisabled]}
          onPress={async () => {
            setLoading(true); setError('');
            const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
            setLoading(false);
            if (err) { setError(err.message); return; }
            setSubmitted(true);
          }}
          disabled={!canSubmit || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Send Reset Link</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backToLogin}>
          <Text style={s.backToLoginText}>← Back to Login</Text>
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
  label: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 24 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#f2b8cc' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backToLogin: { alignSelf: 'center', marginTop: 24 },
  backToLoginText: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  confirmContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  confirmIcon: { fontSize: 64, marginBottom: 24 },
  confirmTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  confirmSub: { fontSize: 15, color: theme.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  confirmEmail: { color: theme.primary, fontWeight: '600' },
  confirmNote: { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 36, lineHeight: 20 },
  resendBtn: { borderWidth: 1.5, borderColor: theme.primary, borderRadius: 10, paddingVertical: 13, width: '100%', alignItems: 'center', marginBottom: 12 },
  resendBtnText: { color: theme.primary, fontSize: 15, fontWeight: '600' },
  resetBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 13, width: '100%', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
