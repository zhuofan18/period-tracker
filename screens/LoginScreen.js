import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Welcome</Text>

        <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#aaa" />
        <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#aaa" />
        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.createBtnText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.orText}>or </Text>
          <TouchableOpacity>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#222',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: '#222',
  },
  createBtn: {
    width: '100%',
    backgroundColor: '#e75480',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  orText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#e75480',
    fontWeight: '600',
  },
});
