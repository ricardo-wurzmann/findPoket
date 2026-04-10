import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { OrganizerTopBar } from '@/components/organizer/OrganizerTopBar';

const GAME_TYPES = ['Texas Hold\'em', 'Omaha', 'Short Deck', 'Outro'];

export default function DealerScreen() {
  const insets = useSafeAreaInsets();
  const [gameType, setGameType] = useState(GAME_TYPES[0]);
  const [dateTime, setDateTime] = useState('');
  const [dealerCount, setDealerCount] = useState('1');
  const [duration, setDuration] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!dateTime || !address || !whatsapp) {
      Alert.alert('Campos obrigatórios', 'Preencha data/hora, endereço e WhatsApp.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    Alert.alert('Solicitação enviada!', 'Entraremos em contato em breve via WhatsApp.', [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.root}>
      <OrganizerTopBar title="Contratar Dealer" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Game type selector */}
          <Text style={styles.label}>Tipo de jogo</Text>
          <View style={styles.typeRow}>
            {GAME_TYPES.map((g) => (
              <TouchableOpacity
                key={g}
                activeOpacity={0.7}
                style={[styles.typeBtn, gameType === g && styles.typeBtnActive]}
                onPress={() => setGameType(g)}
              >
                <Text style={[styles.typeBtnText, gameType === g && styles.typeBtnTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label="Data e hora *"
            value={dateTime}
            onChangeText={setDateTime}
            placeholder="2024-12-01T20:00"
          />
          <Field
            label="Qtd. de dealers *"
            value={dealerCount}
            onChangeText={setDealerCount}
            placeholder="1"
            keyboardType="numeric"
          />
          <Field
            label="Duração estimada"
            value={duration}
            onChangeText={setDuration}
            placeholder="Ex: 6 horas"
          />
          <Field
            label="Endereço *"
            value={address}
            onChangeText={setAddress}
            placeholder="Rua, número, bairro, cidade"
          />
          <Field
            label="WhatsApp *"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
          />
          <Field
            label="Observações"
            value={notes}
            onChangeText={setNotes}
            placeholder="Informações adicionais..."
            multiline
          />

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark} />
            ) : (
              <Text style={styles.submitBtnText}>Solicitar Dealer</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
      <Text style={styles.fieldLabel}>{label}</Text>
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
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 8 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 8 },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  typeBtnTextActive: { color: Colors.dark },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
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
  submitBtn: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
});
