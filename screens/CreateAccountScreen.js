import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function CreateAccountScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [serverError, setServerError]         = useState('');
  const [loading, setLoading]                 = useState(false);

  const fieldErrors = {
    username:        submitted && !username.trim()          ? 'Username is required' : '',
    email:           submitted && !email.trim()             ? 'Email is required'
                   : submitted && !email.includes('@')      ? 'Enter a valid email address' : '',
    password:        submitted && !password                 ? 'Password is required'
                   : submitted && password.length < 6       ? 'Password must be at least 6 characters' : '',
    confirmPassword: submitted && !confirmPassword          ? 'Please confirm your password'
                   : submitted && confirmPassword !== password ? 'Passwords do not match' : '',
  };

  const isValid = !Object.values(fieldErrors).some(Boolean)
    && username.trim() && email.trim() && email.includes('@')
    && password.length >= 6 && confirmPassword === password;

  const handleCreate = async () => {
    setSubmitted(true);
    setServerError('');
    if (!username.trim() || !email.trim() || !email.includes('@') || password.length < 6 || password !== confirmPassword) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setLoading(false);
    if (error) { setServerError(error.message); return; }

    if (!data.session) {
      // Supabase email confirmation is enabled — user must confirm before logging in
      setServerError(
        '✅ Account created! Check your email for a confirmation link, then log in.'
      );
      return;
    }

    navigation.navigate('Goals');
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.header}>Create Account</Text>
        <Text style={s.sub}>Almost there! Set up your username and password.</Text>

        <Text style={s.label}>Username</Text>
        <TextInput
          style={[s.input, fieldErrors.username && s.inputError]}
          placeholder="Choose a username"
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        {fieldErrors.username ? <Text style={s.fieldError}>{fieldErrors.username}</Text> : null}

        <Text style={s.label}>Email</Text>
        <TextInput
          style={[s.input, fieldErrors.email && s.inputError]}
          placeholder="Enter your email"
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {fieldErrors.email ? <Text style={s.fieldError}>{fieldErrors.email}</Text> : null}

        <Text style={s.label}>Password</Text>
        <View style={[s.passwordWrapper, fieldErrors.password && s.inputError]}>
          <TextInput
            style={s.passwordInput}
            placeholder="At least 6 characters"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
            <Text style={s.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {fieldErrors.password ? <Text style={s.fieldError}>{fieldErrors.password}</Text> : null}

        <Text style={s.label}>Confirm Password</Text>
        <TextInput
          style={[s.input, fieldErrors.confirmPassword && s.inputError]}
          placeholder="Re-enter your password"
          placeholderTextColor={theme.placeholder}
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); }}
        />
        {fieldErrors.confirmPassword ? <Text style={s.fieldError}>{fieldErrors.confirmPassword}</Text> : null}

        {serverError ? <Text style={s.serverError}>{serverError}</Text> : null}

        <TouchableOpacity
          style={[s.createBtn, loading && s.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.createBtnText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen:           { flex: 1, backgroundColor: theme.background },
  container:        { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56, paddingBottom: 40 },
  backBtn:          { marginBottom: 24 },
  backArrow:        { fontSize: 22, color: theme.text },
  header:           { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  sub:              { fontSize: 14, color: theme.muted, marginBottom: 32 },
  label:            { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:            { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 4 },
  inputError:       { borderColor: '#e74c3c' },
  passwordWrapper:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 4, backgroundColor: theme.inputBg },
  passwordInput:    { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn:           { padding: 4 },
  eyeText:          { fontSize: 18 },
  fieldError:       { color: '#e74c3c', fontSize: 12, marginBottom: 14, marginTop: 2 },
  serverError:      { color: '#e74c3c', fontSize: 13, marginBottom: 12, marginTop: 4, textAlign: 'center' },
  createBtn:        { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  createBtnDisabled: { backgroundColor: '#f2b8cc' },
  createBtnText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
