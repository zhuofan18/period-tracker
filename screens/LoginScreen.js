import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.header}>Welcome</Text>
        <TextInput style={s.input} placeholder="First Name" placeholderTextColor={theme.placeholder} />
        <TextInput style={s.input} placeholder="Last Name" placeholderTextColor={theme.placeholder} />
        <TextInput style={s.input} placeholder="Age" placeholderTextColor={theme.placeholder} keyboardType="numeric" />
        <TextInput style={s.input} placeholder="Email Address" placeholderTextColor={theme.placeholder} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={s.createBtnText}>Create Account</Text>
        </TouchableOpacity>
        <View style={s.loginRow}>
          <Text style={s.orText}>or </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginForm')}>
            <Text style={s.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, color: theme.text },
  input: { width: '100%', borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 14, color: theme.text, backgroundColor: theme.inputBg },
  createBtn: { width: '100%', backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  orText: { fontSize: 14, color: theme.subtext },
  loginLink: { fontSize: 14, color: theme.primary, fontWeight: '600' },
});
