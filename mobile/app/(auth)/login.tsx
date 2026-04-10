import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError('Email ou senha incorretos.');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/me`,
        {
          headers: {
            Authorization: `Bearer ${authData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      console.log('[login] /api/me response:', JSON.stringify(data));
      const role = data.user?.role;
      console.log('[login] role detected:', role);

      if (role === 'ORGANIZER') {
        console.log('[login] redirecting to organizer/dashboard');
        router.replace('/organizer/dashboard');
      } else {
        console.log('[login] redirecting to /(tabs)/');
        router.replace('/(tabs)');
      }
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.suits}>♠ ♥ ♦ ♣</Text>
          <Text style={styles.logo}>FindPoker</Text>
          <Text style={styles.subtitle}>Encontre torneios e casas de poker</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.btnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkRow}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.linkText}>
              Não tem conta?{' '}
              <Text style={styles.link}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  suits: {
    fontSize: 20,
    color: Colors.textMuted,
    letterSpacing: 8,
    marginBottom: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  input: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.white,
  },
  error: {
    fontSize: 13,
    color: '#F87171',
    textAlign: 'center',
  },
  btn: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  link: {
    color: Colors.white,
    fontWeight: '600',
  },
});
