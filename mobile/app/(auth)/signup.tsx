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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Role = 'PLAYER' | 'ORGANIZER';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>('PLAYER');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [hendonMob, setHendonMob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const token = data.session?.access_token;
    if (!token) {
      setLoading(false);
      setError('Verifique seu email para confirmar a conta.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          handle: handle || null,
          email: email.trim(),
          city: city || null,
          role,
          birthDate: role === 'PLAYER' && birthDate ? birthDate : null,
          phone: role === 'PLAYER' && phone ? phone : null,
          profession: role === 'PLAYER' && profession ? profession : null,
          hendonMob: role === 'PLAYER' && hendonMob ? hendonMob : null,
        }),
      });

      if (!res.ok) throw new Error('Falha ao criar usuário.');

      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
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
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.suits}>♠ ♥ ♦ ♣</Text>
          <Text style={styles.logo}>FindPoker</Text>
          <Text style={styles.subtitle}>Crie sua conta</Text>
        </View>

        {/* Role toggle */}
        <View style={styles.roleToggle}>
          {(['PLAYER', 'ORGANIZER'] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              activeOpacity={0.7}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r === 'PLAYER' ? 'Jogador' : 'Organizador'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <Field label="Nome *" value={name} onChangeText={setName} placeholder="Seu nome completo" />
          <Field label="Handle (opcional)" value={handle} onChangeText={setHandle} placeholder="@seunick" autoCapitalize="none" />
          <Field label="Email *" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Senha *" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry />
          <Field label="Cidade" value={city} onChangeText={setCity} placeholder="São Paulo" />

          {role === 'PLAYER' && (
            <>
              <Field
                label="Data de nascimento"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
              />
              <Field
                label="Telefone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+55 11 99999-9999"
                keyboardType="phone-pad"
              />
              <Field
                label="Profissão"
                value={profession}
                onChangeText={setProfession}
                placeholder="Ex: Engenheiro"
              />
              <Field
                label="Hendon Mob URL"
                value={hendonMob}
                onChangeText={setHendonMob}
                placeholder="https://pokerdb.thehendonmob.com/..."
                autoCapitalize="none"
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.btnText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkRow}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              Já tem conta? <Text style={styles.link}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', autoCapitalize }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  container: { flexGrow: 1, paddingHorizontal: 28 },
  header: { alignItems: 'center', marginBottom: 28 },
  suits: { fontSize: 18, color: Colors.textMuted, letterSpacing: 8, marginBottom: 6 },
  logo: { fontSize: 40, fontWeight: '800', fontStyle: 'italic', color: Colors.white, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textMuted },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: Colors.white },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  roleBtnTextActive: { color: Colors.dark },
  form: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
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
  error: { fontSize: 13, color: '#F87171', textAlign: 'center' },
  btn: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  linkRow: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 14, color: Colors.textMuted },
  link: { color: Colors.white, fontWeight: '600' },
});
