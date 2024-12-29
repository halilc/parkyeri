import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  onLogin: (userData: any) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_EXPO_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
  });

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('http://192.168.1.103:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@parkyeri.com',
          password: 'admin123',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      const user = await response.json();
      onLogin(user);
    } catch (err) {
      setError('Admin girişi yapılırken bir hata oluştu');
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await promptAsync();
    if (result?.type === 'success') {
      const { authentication } = result;
      // Google kullanıcı bilgilerini al
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${authentication?.accessToken}` },
      });
      const userData = await userInfoResponse.json();
      
      // Backend'e gönder
      const response = await fetch('http://192.168.1.103:3000/users/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
        }),
      });
      
      const user = await response.json();
      onLogin(user);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const response = await fetch('http://192.168.1.103:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      const user = await response.json();
      onLogin(user);
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch('http://192.168.1.103:3000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.error);
        return;
      }

      const user = await response.json();
      onLogin(user);
    } catch (err) {
      setError('Kayıt olurken bir hata oluştu');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ParkYeri</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <TouchableOpacity style={[styles.button, styles.adminButton]} onPress={handleAdminLogin}>
          <Text style={styles.buttonText}>Admin Girişi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleEmailLogin}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => setShowRegister(true)}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn}>
          <Text style={styles.buttonText}>Google ile Giriş Yap</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showRegister} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.title}>Kayıt Ol</Text>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Kayıt Ol</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
              setShowRegister(false);
              setError('');
            }}>
              <Text style={styles.buttonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  adminButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
}); 