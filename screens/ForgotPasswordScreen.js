import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const canSubmit = username.trim().length > 0;

  const handleSend = async () => {
    setLoading(true);
    setError('');

    // Look up email from username
    const { data: email, error: lookupError } = await supabase
      .rpc('get_email_by_username', { p_username: username.trim() });

    if (lookupError || !email) {
      setLoading(false);
      setError('No account found with that username.');
      return;
    }

    // redirectTo must be in your Supabase allowed redirect URLs list
    const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectTo ? { redirectTo } : {}),
    });

    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setSubmitted(true);
  };

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
            We sent a password reset link to the email address linked to{'\n'}
            <Text style={s.confirmHighlight}>@{username}</Text>
          </Text>
          <View style={s.stepsCard}>
            <Text style={s.stepsTitle}>Next steps</Text>
            <Text style={s.step}>1. Open the email from Luna</Text>
            <Text style={s.step}>2. Click the "Reset Password" link</Text>
            <Text style={s.step}>3. You'll be brought back here to set a new password</Text>
          </View>
          <Text style={s.confirmNote}>Didn't receive it? Check your spam folder.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => setSubmitted(false)}>
            <Text style={s.retryBtnText}>Try a different username</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('LoginForm')}>
            <Text style={s.loginBtnText}>Back to Login</Text>
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
        <Text style={s.sub}>Enter your username and we'll send a reset link to the email on your account.</Text>

        <Text style={s.label}>Username</Text>
        <TextInput
          style={[s.input, error && s.inputError]}
          placeholder="Enter your username"
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={(v) => { setUsername(v); setError(''); }}
        />
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.submitBtn, (!canSubmit || loading) && s.submitBtnDisabled]}
          onPress={handleSend}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitBtnText}>Send Reset Link</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backToLogin}>
          <Text style={s.backToLoginText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: theme.background },
  container:  { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56 },
  backBtn:    { marginBottom: 24 },
  backArrow:  { fontSize: 22, color: theme.text },
  header:     { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  sub:        { fontSize: 14, color: theme.muted, marginBottom: 32, lineHeight: 21 },
  label:      { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 4 },
  inputError: { borderColor: '#e74c3c' },
  errorText:  { color: '#e74c3c', fontSize: 13, marginBottom: 16 },
  submitBtn:         { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  submitBtnDisabled: { backgroundColor: '#f2b8cc' },
  submitBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  backToLogin:     { alignSelf: 'center', marginTop: 24 },
  backToLoginText: { fontSize: 14, color: theme.primary, fontWeight: '600' },

  // Confirmation state
  confirmContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  confirmIcon:       { fontSize: 64, marginBottom: 20 },
  confirmTitle:      { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 10 },
  confirmSub:        { fontSize: 15, color: theme.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmHighlight:  { color: theme.primary, fontWeight: '700' },
  stepsCard:         { backgroundColor: theme.card, borderRadius: 14, padding: 16, width: '100%', marginBottom: 16, gap: 8 },
  stepsTitle:        { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 4 },
  step:              { fontSize: 13, color: theme.subtext, lineHeight: 20 },
  confirmNote:       { fontSize: 12, color: theme.muted, textAlign: 'center', marginBottom: 28 },
  retryBtn:          { borderWidth: 1.5, borderColor: theme.primary, borderRadius: 10, paddingVertical: 13, width: '100%', alignItems: 'center', marginBottom: 12 },
  retryBtnText:      { color: theme.primary, fontSize: 15, fontWeight: '600' },
  loginBtn:          { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 13, width: '100%', alignItems: 'center' },
  loginBtnText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
});
