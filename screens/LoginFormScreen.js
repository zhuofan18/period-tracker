import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { fontFamily } from '../theme/typography';

// ─── Web Credential Management helpers ───────────────────────────────────────
const credApiAvailable =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.PasswordCredential !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  typeof navigator.credentials !== 'undefined';

async function getSavedCredential() {
  if (!credApiAvailable) return null;
  try {
    const cred = await navigator.credentials.get({ password: true, mediation: 'silent' });
    return cred || null;
  } catch {
    return null;
  }
}

async function storeCredential(id, password) {
  if (!credApiAvailable) return;
  try {
    const cred = new window.PasswordCredential({ id, password });
    await navigator.credentials.store(cred);
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginFormScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [serverError, setServerError]   = useState('');
  const [loading, setLoading]           = useState(false);

  // Saved credential found by the browser
  const [savedCred, setSavedCred]       = useState(null);
  const [credLoading, setCredLoading]   = useState(false);

  const passwordRef = useRef(null);

  useEffect(() => {
    getSavedCredential().then(cred => {
      if (cred) setSavedCred(cred);
    });
  }, []);

  const fieldErrors = {
    username: submitted && !username.trim() ? 'Username is required' : '',
    password: submitted && !password        ? 'Password is required'
            : submitted && password.length < 6 ? 'Password must be at least 6 characters' : '',
  };

  // Core sign-in: accepts explicit values so both paths can call it
  const signIn = async (usernameVal, passwordVal, saveAfter = false) => {
    const { data: email, error: lookupError } = await supabase
      .rpc('get_email_by_username', { p_username: usernameVal.trim() });

    if (lookupError) {
      if (lookupError.message?.includes('does not exist')) {
        setServerError('Setup incomplete: run schema_update_username_login.sql in your Supabase SQL Editor.');
      } else {
        setServerError(lookupError.message);
      }
      return false;
    }

    if (!email) {
      setServerError('No account found with that username.');
      return false;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password: passwordVal });
    if (error) {
      if (error.message?.toLowerCase().includes('confirm')) {
        setServerError('Please confirm your email address before logging in. Check your inbox.');
      } else if (error.message?.toLowerCase().includes('invalid')) {
        setServerError('Incorrect password.');
      } else {
        setServerError(error.message);
      }
      return false;
    }

    // Sync email into profiles so it's always stored and up to date
    if (signInData?.user) {
      await supabase.from('profiles').upsert(
        { id: signInData.user.id, email: signInData.user.email },
        { onConflict: 'id' }
      );
    }

    if (saveAfter) await storeCredential(usernameVal.trim(), passwordVal);
    return true;
  };

  // Manual form submit
  const handleLogin = async () => {
    setSubmitted(true);
    setServerError('');
    if (!username.trim() || password.length < 6) return;
    setLoading(true);
    const ok = await signIn(username, password, true);
    setLoading(false);
    if (ok) navigation.navigate('MainApp');
  };

  // One-tap continue with saved credential
  const handleSavedLogin = async () => {
    setCredLoading(true);
    setServerError('');
    const ok = await signIn(savedCred.id, savedCred.password);
    setCredLoading(false);
    if (ok) navigation.navigate('MainApp');
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.header}>Welcome back</Text>
        <Text style={s.sub}>Log in with your username and password</Text>

        {/* ── One-tap saved credential card (web only) ── */}
        {savedCred && (
          <TouchableOpacity
            style={s.savedCard}
            onPress={handleSavedLogin}
            activeOpacity={0.8}
            disabled={credLoading}
          >
            <View style={s.savedAvatar}>
              <Text style={s.savedAvatarText}>
                {savedCred.id.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.savedInfo}>
              <Text style={s.savedName}>{savedCred.id}</Text>
              <Text style={s.savedHint}>Tap to continue</Text>
            </View>
            {credLoading
              ? <ActivityIndicator color={theme.primary} />
              : <Text style={s.savedArrow}>→</Text>}
          </TouchableOpacity>
        )}

        {savedCred && (
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or sign in with a different account</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* ── Manual form ── */}
        <Text style={s.label}>Username</Text>
        <TextInput
          style={[s.input, fieldErrors.username && s.inputError]}
          placeholder="Enter your username"
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
          {...(Platform.OS === 'web' ? { name: 'username' } : {})}
          value={username}
          onChangeText={(v) => { setUsername(v); setServerError(''); }}
        />
        {fieldErrors.username ? <Text style={s.fieldError}>{fieldErrors.username}</Text> : null}

        <Text style={s.label}>Password</Text>
        <View style={[s.passwordWrapper, fieldErrors.password && s.inputError]}>
          <TextInput
            ref={passwordRef}
            style={s.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            {...(Platform.OS === 'web' ? { name: 'password' } : {})}
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
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.loginBtnText}>Log In</Text>}
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
  header:          { fontSize: 28, fontFamily: fontFamily.bold, color: theme.text, marginBottom: 6 },
  sub:             { fontSize: 14, color: theme.muted, marginBottom: 24 },

  // Saved credential card
  savedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card,
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: theme.primary,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(231,84,128,0.12)' },
      default: { shadowColor: '#e75480', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
    }),
  },
  savedAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
  },
  savedAvatarText: { color: '#fff', fontSize: 18, fontFamily: fontFamily.bold },
  savedInfo:       { flex: 1 },
  savedName:       { fontSize: 15, fontFamily: fontFamily.bold, color: theme.text },
  savedHint:       { fontSize: 12, color: theme.muted, marginTop: 2 },
  savedArrow:      { fontSize: 18, color: theme.primary },

  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText:  { fontSize: 11, color: theme.muted, textAlign: 'center', flexShrink: 1 },

  label:           { fontSize: 13, fontFamily: fontFamily.semibold, color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 4 },
  inputError:      { borderColor: '#e74c3c' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 4, backgroundColor: theme.inputBg },
  passwordInput:   { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn:          { padding: 4 },
  eyeText:         { fontSize: 18 },
  fieldError:      { color: '#e74c3c', fontSize: 12, marginBottom: 14, marginTop: 2 },
  serverError:     { color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  forgotRow:       { alignSelf: 'flex-end', marginBottom: 24, marginTop: 6 },
  forgotText:      { fontSize: 13, color: theme.primary, fontFamily: fontFamily.semibold },
  loginBtn:        { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled: { backgroundColor: '#f2b8cc' },
  loginBtnText:    { color: '#fff', fontSize: 16, fontFamily: fontFamily.semibold },
  signupRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt:    { fontSize: 14, color: theme.subtext },
  signupLink:      { fontSize: 14, color: theme.primary, fontFamily: fontFamily.semibold },
});
