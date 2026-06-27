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
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);

  const canSubmit = username.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && confirmPassword.length > 0;

  const handleCreate = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
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
        <TextInput style={s.input} placeholder="Choose a username" placeholderTextColor={theme.placeholder} autoCapitalize="none" value={username} onChangeText={setUsername} />

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={theme.placeholder} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

        <Text style={s.label}>Password</Text>
        <View style={s.passwordWrapper}>
          <TextInput style={s.passwordInput} placeholder="At least 6 characters" placeholderTextColor={theme.placeholder} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
            <Text style={s.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Confirm Password</Text>
        <TextInput style={s.input} placeholder="Re-enter your password" placeholderTextColor={theme.placeholder} secureTextEntry={!showPassword} value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setError(''); }} />

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[s.createBtn, (!canSubmit || loading) && s.createBtnDisabled]} onPress={handleCreate} disabled={!canSubmit || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.createBtnText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 56, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backArrow: { fontSize: 22, color: theme.text },
  header: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.muted, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: theme.text, backgroundColor: theme.inputBg, marginBottom: 20 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, marginBottom: 20, backgroundColor: theme.inputBg },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: theme.text },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 18 },
  errorText: { color: '#e74c3c', fontSize: 13, marginBottom: 12, marginTop: -8 },
  createBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { backgroundColor: '#f2b8cc' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
