import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function LoginFormScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [serverError, setServerError]   = useState('');
  const [loading, setLoading]           = useState(false);

  const fieldErrors = {
    email:    submitted && !email.trim()        ? 'Email is required'
            : submitted && !email.includes('@') ? 'Enter a valid email address' : '',
    password: submitted && !password            ? 'Password is required'
            : submitted && password.length < 6  ? 'Password must be at least 6 characters' : '',
  };

  const handleLogin = async () => {
    setSubmitted(true);
    setServerError('');
    if (!email.trim() || !email.includes('@') || password.length < 6) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) { setServerError(error.message); return; }
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
        <TextInput
          style={[s.input, fieldErrors.email && s.inputError]}
          placeholder="Enter your email"
          placeholderTextColor={theme.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(v) => { setEmail(v); setServerError(''); }}
        />
        {fieldErrors.email ? <Text style={s.fieldError}>{fieldErrors.email}</Text> : null}

        <Text style={s.label}>Password</Text>
        <View style={[s.passwordWrapper, fieldErrors.password && s.inputError]}>
          <TextInput
            style={s.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(v) => { setPassword(v); setServerError(''); }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
            <Text style={s.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {fieldErrors.password ? <Text style={s.fieldError}>{fieldErrors.password}</Text> : null}

        <TouchableOpacity style={s.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {serverError ? <Text style={s.serverError}>{serverError}</Text> : null}

        <TouchableOpacity
          style={[s.loginBtn, loading && s.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginBtnText}>Log In</Text>}
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
  screen:          { flex: 1, backgroundColor: theme.background },
  container:       { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56, paddingBottom: 40 },
  backBtn:         { marginBottom: 24 },
  backArrow:       { fontSize: 22, color: theme.text },
  header:          { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
  sub:             { fontSize: 14, color: theme.muted, marginBottom: 32 },
  label:           { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 4 },
  inputError:      { borderColor: '#e74c3c' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 4, backgroundColor: theme.inputBg },
  passwordInput:   { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn:          { padding: 4 },
  eyeText:         { fontSize: 18 },
  fieldError:      { color: '#e74c3c', fontSize: 12, marginBottom: 14, marginTop: 2 },
  serverError:     { color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  forgotRow:       { alignSelf: 'flex-end', marginBottom: 24, marginTop: 6 },
  forgotText:      { fontSize: 13, color: theme.primary, fontWeight: '600' },
  loginBtn:        { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled: { backgroundColor: '#f2b8cc' },
  loginBtnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  signupRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt:    { fontSize: 14, color: theme.subtext },
  signupLink:      { fontSize: 14, color: theme.primary, fontWeight: '600' },
});
