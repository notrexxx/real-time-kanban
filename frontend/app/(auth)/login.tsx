import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium Kanban</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none" 
        keyboardType="email-address" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password}
        onChangeText={setPassword}
        secureTextEntry 
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#0f172a' },
  input: { backgroundColor: '#ffffff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#ef4444', marginBottom: 15, textAlign: 'center', fontWeight: '500' }
});