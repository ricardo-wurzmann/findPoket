import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { EventType } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const EVENT_TYPES: { key: EventType; label: string }[] = [
  { key: 'TOURNAMENT', label: 'Torneio' },
  { key: 'CASH_GAME', label: 'Cash Game' },
  { key: 'HOME_GAME', label: 'Home Game' },
];

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const [eventType, setEventType] = useState<EventType>('TOURNAMENT');
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [description, setDescription] = useState('');
  const [gtd, setGtd] = useState('');
  const [startingStack, setStartingStack] = useState('');
  const [levelDuration, setLevelDuration] = useState('');
  const [rebuyPolicy, setRebuyPolicy] = useState('');
  const [blinds, setBlinds] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name || !buyIn || !startsAt) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const body: Record<string, unknown> = {
        name,
        type: eventType,
        buyIn: parseFloat(buyIn),
        maxPlayers: parseInt(maxPlayers) || 0,
        startsAt,
        description: description || null,
        locationLabel: locationLabel || null,
      };

      if (eventType === 'TOURNAMENT') {
        body.gtd = gtd ? parseFloat(gtd) : null;
        body.startingStack = startingStack || null;
        body.levelDuration = levelDuration || null;
        body.rebuyPolicy = rebuyPolicy || null;
      }

      if (eventType === 'CASH_GAME') {
        body.blinds = blinds || null;
      }

      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Falha ao criar evento.');

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity activeOpacity={0.7} style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Criar Evento</Text>

        {/* Type selector */}
        <View style={styles.typeRow}>
          {EVENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.7}
              style={[styles.typeBtn, eventType === t.key && styles.typeBtnActive]}
              onPress={() => setEventType(t.key)}
            >
              <Text style={[styles.typeBtnText, eventType === t.key && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Common fields */}
        <Field label="Nome do evento *" value={name} onChangeText={setName} placeholder="Ex: Sunday Main Event" />
        <Field label="Buy-in (R$) *" value={buyIn} onChangeText={setBuyIn} placeholder="100" keyboardType="numeric" />
        <Field label="Máx. jogadores" value={maxPlayers} onChangeText={setMaxPlayers} placeholder="100" keyboardType="numeric" />
        <Field label="Data/Hora início *" value={startsAt} onChangeText={setStartsAt} placeholder="2024-12-01T20:00:00" />
        <Field label="Local" value={locationLabel} onChangeText={setLocationLabel} placeholder="Endereço ou nome do local" />
        <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Detalhes do evento..." multiline />

        {/* Tournament-specific */}
        {eventType === 'TOURNAMENT' && (
          <>
            <Field label="GTD (R$)" value={gtd} onChangeText={setGtd} placeholder="10000" keyboardType="numeric" />
            <Field label="Stack inicial" value={startingStack} onChangeText={setStartingStack} placeholder="10.000" />
            <Field label="Duração do nível" value={levelDuration} onChangeText={setLevelDuration} placeholder="15 min" />
            <Field label="Política de rebuy" value={rebuyPolicy} onChangeText={setRebuyPolicy} placeholder="1 rebuy + 1 add-on" />
          </>
        )}

        {/* Cash Game specific */}
        {eventType === 'CASH_GAME' && (
          <Field label="Blinds" value={blinds} onChangeText={setBlinds} placeholder="1/2" />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark} />
          ) : (
            <Text style={styles.createBtnText}>Criar evento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  container: { paddingHorizontal: 20 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', fontStyle: 'italic', color: Colors.white, marginBottom: 20 },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.white },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  typeBtnTextActive: { color: Colors.dark },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
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
  inputMultiline: {
    height: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  errorText: { color: '#F87171', fontSize: 13, marginBottom: 8 },
  createBtn: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createBtnDisabled: { opacity: 0.7 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
});
