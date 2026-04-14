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
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { EventType } from '@/types';
import { OrganizerTopBar } from '@/components/organizer/OrganizerTopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const EVENT_TYPES: { key: EventType; label: string }[] = [
  { key: 'TOURNAMENT', label: 'Torneio' },
  { key: 'CASH_GAME', label: 'Cash Game' },
  { key: 'HOME_GAME', label: 'Home Game' },
];

const BLIND_PRESETS = [
  { id: 'turbo', label: 'Turbo', sublabel: '15min', summary: '10 níveis · ~2h30min', levelCount: 10, totalMin: 155 },
  { id: 'standard', label: 'Standard', sublabel: '25min', summary: '14 níveis · ~6h', levelCount: 14, totalMin: 380 },
  { id: 'deepstack', label: 'Deep Stack', sublabel: '30min', summary: '17 níveis · ~8h30min', levelCount: 17, totalMin: 540 },
  { id: 'bsop', label: 'BSOP', sublabel: '30/25min', summary: '19 níveis · ~10h', levelCount: 19, totalMin: 625 },
];

const GAME_STYLES = ['NLH', 'PLO', 'Mixed'] as const;
type GameStyle = typeof GAME_STYLES[number];

const SEATS_PRESETS = [6, 8, 9] as const;

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const [eventType, setEventType] = useState<EventType>('TOURNAMENT');
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [description, setDescription] = useState('');
  const [gtd, setGtd] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tournament — blind structure
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [startStack, setStartStack] = useState('10000');

  // Tournament — rebuy / addon
  const [rebuyEnabled, setRebuyEnabled] = useState(false);
  const [rebuyStack, setRebuyStack] = useState('');
  const [rebuyPrice, setRebuyPrice] = useState('');
  const [addonEnabled, setAddonEnabled] = useState(false);
  const [addonStack, setAddonStack] = useState('');
  const [addonPrice, setAddonPrice] = useState('');

  // Cash game
  const [blindType, setBlindType] = useState<'sb-bb' | 'button'>('sb-bb');
  const [sbValue, setSbValue] = useState('');
  const [bbValue, setBbValue] = useState('');
  const [btnValue, setBtnValue] = useState('');
  const [gameStyle, setGameStyle] = useState<GameStyle>('NLH');
  const [buyinMin, setBuyinMin] = useState('');
  const [buyinMax, setBuyinMax] = useState('');
  const [tableCount, setTableCount] = useState('1');
  const [seatsPerTable, setSeatsPerTable] = useState<number | null>(9);
  const [rake, setRake] = useState('');
  const [waitlistActive, setWaitlistActive] = useState(true);

  const isCashGame = eventType === 'CASH_GAME';
  const isTournament = eventType === 'TOURNAMENT' || eventType === 'HOME_GAME';

  const handleCreate = async () => {
    if (!name || !startsAt) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (!isCashGame && !buyIn) {
      setError('Buy-in obrigatório.');
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
        buyIn: isCashGame ? 0 : parseFloat(buyIn),
        maxPlayers: parseInt(maxPlayers) || 0,
        startsAt,
        description: description || null,
        locationLabel: locationLabel || null,
      };

      if (isTournament) {
        body.gtd = gtd ? parseFloat(gtd) : null;
        body.startStack = parseInt(startStack) || 10000;
        body.rebuyEnabled = rebuyEnabled;
        if (rebuyEnabled) {
          body.rebuyStack = rebuyStack ? parseInt(rebuyStack) : null;
          body.rebuyPrice = rebuyPrice ? parseFloat(rebuyPrice) : null;
        }
        body.addonEnabled = addonEnabled;
        if (addonEnabled) {
          body.addonStack = addonStack ? parseInt(addonStack) : null;
          body.addonPrice = addonPrice ? parseFloat(addonPrice) : null;
        }
        // Send preset name as blindStructure metadata if preset selected
        if (selectedPreset) {
          body.levelDuration = BLIND_PRESETS.find((p) => p.id === selectedPreset)?.sublabel ?? null;
        }
      }

      if (isCashGame) {
        body.blindType = blindType;
        if (blindType === 'sb-bb') {
          body.sbValue = sbValue ? parseFloat(sbValue) : null;
          body.bbValue = bbValue ? parseFloat(bbValue) : null;
        } else {
          body.btnValue = btnValue ? parseFloat(btnValue) : null;
        }
        body.buyinMin = buyinMin ? parseFloat(buyinMin) : null;
        body.buyinMax = buyinMax ? parseFloat(buyinMax) : null;
        body.tableCount = tableCount ? parseInt(tableCount) : 1;
        body.seatsPerTable = seatsPerTable;
        body.rake = rake ? parseFloat(rake) : null;
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
    <View style={styles.root}>
      <OrganizerTopBar title="Criar Evento" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
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
          <Field label="Data/Hora início *" value={startsAt} onChangeText={setStartsAt} placeholder="2024-12-01T20:00:00" />
          <Field label="Máx. jogadores" value={maxPlayers} onChangeText={setMaxPlayers} placeholder="100" keyboardType="numeric" />
          <Field label="Local" value={locationLabel} onChangeText={setLocationLabel} placeholder="Endereço ou nome do local" />
          <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Detalhes..." multiline />

          {/* TOURNAMENT / HOME_GAME fields */}
          {isTournament && (
            <>
              <Field label="Buy-in (R$) *" value={buyIn} onChangeText={setBuyIn} placeholder="100" keyboardType="numeric" />
              <Field label="GTD (R$)" value={gtd} onChangeText={setGtd} placeholder="10000" keyboardType="numeric" />

              {/* Blind presets */}
              <SectionHeader title="Estrutura de Blinds" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {BLIND_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.7}
                    style={[styles.presetPill, selectedPreset === p.id && styles.presetPillActive]}
                    onPress={() => setSelectedPreset(p.id)}
                  >
                    <Text style={[styles.presetPillLabel, selectedPreset === p.id && styles.presetPillLabelActive]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.presetPillSub, selectedPreset === p.id && styles.presetPillSubActive]}>
                      {p.sublabel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedPreset && (
                <View style={styles.presetSummary}>
                  <Text style={styles.presetSummaryText}>
                    {BLIND_PRESETS.find((p) => p.id === selectedPreset)?.summary}
                  </Text>
                  {BLIND_PRESETS.find((p) => p.id === selectedPreset)?.id === 'turbo' && (
                    <Text style={styles.presetPreviewText}>100/200 · 150/300 · 200/400 · ...</Text>
                  )}
                  {BLIND_PRESETS.find((p) => p.id === selectedPreset)?.id === 'standard' && (
                    <Text style={styles.presetPreviewText}>100/200 · 150/300 · 200/400 · 300/600 · ...</Text>
                  )}
                  {BLIND_PRESETS.find((p) => p.id === selectedPreset)?.id === 'deepstack' && (
                    <Text style={styles.presetPreviewText}>100/200 · 100/300 · 150/300 · 200/400 · ...</Text>
                  )}
                  {BLIND_PRESETS.find((p) => p.id === selectedPreset)?.id === 'bsop' && (
                    <Text style={styles.presetPreviewText}>100/200 · 100/300 · 150/300 · 200/400 · ...</Text>
                  )}
                </View>
              )}

              <Field
                label="Stack inicial"
                value={startStack}
                onChangeText={setStartStack}
                placeholder="10000"
                keyboardType="numeric"
              />

              {/* Rebuy */}
              <SectionHeader title="Rebuy" />
              <ToggleRow label="Rebuy ativo" value={rebuyEnabled} onChange={setRebuyEnabled} />
              {rebuyEnabled && (
                <>
                  <Field label="Stack do rebuy" value={rebuyStack} onChangeText={setRebuyStack} placeholder="10000" keyboardType="numeric" />
                  <Field label="Preço do rebuy (R$)" value={rebuyPrice} onChangeText={setRebuyPrice} placeholder="200" keyboardType="numeric" />
                </>
              )}

              {/* Add-on */}
              <SectionHeader title="Add-on" />
              <ToggleRow label="Add-on ativo" value={addonEnabled} onChange={setAddonEnabled} />
              {addonEnabled && (
                <>
                  <Field label="Stack do add-on" value={addonStack} onChangeText={setAddonStack} placeholder="10000" keyboardType="numeric" />
                  <Field label="Preço do add-on (R$)" value={addonPrice} onChangeText={setAddonPrice} placeholder="200" keyboardType="numeric" />
                </>
              )}
            </>
          )}

          {/* CASH GAME fields */}
          {isCashGame && (
            <>
              <SectionHeader title="Configuração do Jogo" />

              {/* Blind type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Tipo de Blind</Text>
                <View style={styles.segRow}>
                  {(['sb-bb', 'button'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.segBtn, blindType === t && styles.segBtnActive]}
                      onPress={() => setBlindType(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.segBtnText, blindType === t && styles.segBtnTextActive]}>
                        {t === 'sb-bb' ? 'SB / BB' : 'Button Blind'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {blindType === 'sb-bb' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>SB / BB</Text>
                  <View style={styles.pairedInputRow}>
                    <TextInput
                      style={[styles.input, styles.pairedInput]}
                      value={sbValue}
                      onChangeText={setSbValue}
                      placeholder="1"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={styles.separator}>/</Text>
                    <TextInput
                      style={[styles.input, styles.pairedInput]}
                      value={bbValue}
                      onChangeText={setBbValue}
                      placeholder="2"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <Field label="Button Blind" value={btnValue} onChangeText={setBtnValue} placeholder="2" keyboardType="numeric" />
              )}

              {/* Game style */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Modalidade</Text>
                <View style={styles.pillRow}>
                  {GAME_STYLES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.pill, gameStyle === s && styles.pillActive]}
                      onPress={() => setGameStyle(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, gameStyle === s && styles.pillTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Buy-in range */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Buy-in (mín – máx)</Text>
                <View style={styles.pairedInputRow}>
                  <TextInput
                    style={[styles.input, styles.pairedInput]}
                    value={buyinMin}
                    onChangeText={setBuyinMin}
                    placeholder="Min"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={styles.separator}>–</Text>
                  <TextInput
                    style={[styles.input, styles.pairedInput]}
                    value={buyinMax}
                    onChangeText={setBuyinMax}
                    placeholder="Max"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Tables + seats */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mesas</Text>
                <TextInput
                  style={styles.input}
                  value={tableCount}
                  onChangeText={setTableCount}
                  placeholder="1"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Lugares por mesa</Text>
                <View style={styles.pillRow}>
                  {SEATS_PRESETS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.pill, seatsPerTable === s && styles.pillActive]}
                      onPress={() => setSeatsPerTable(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, seatsPerTable === s && styles.pillTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Field label="Rake %" value={rake} onChangeText={setRake} placeholder="5" keyboardType="numeric" />

              <SectionHeader title="Lista de Espera" />
              <ToggleRow label="Lista de espera ativa" value={waitlistActive} onChange={setWaitlistActive} />
            </>
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
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sectionHeaderStyles.container}>
      <Text style={sectionHeaderStyles.text}>{title}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingBottom: 6 },
  text: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: Colors.textMuted, textTransform: 'uppercase' },
});

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={toggleStyles.row}>
      <Text style={toggleStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.green }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingVertical: 4 },
  label: { fontSize: 13, color: Colors.textSecondary },
});

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
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 4 },
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
  pairedInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairedInput: { flex: 1 },
  separator: { fontSize: 18, fontWeight: '300', color: Colors.textMuted },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  segBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  segBtnTextActive: { color: Colors.dark },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  pillTextActive: { color: Colors.dark },
  presetScroll: { marginBottom: 12 },
  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    alignItems: 'center',
  },
  presetPillActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  presetPillLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  presetPillLabelActive: { color: Colors.dark },
  presetPillSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  presetPillSubActive: { color: Colors.dark },
  presetSummary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  presetSummaryText: { fontSize: 13, fontWeight: '600', color: Colors.white, marginBottom: 4 },
  presetPreviewText: { fontSize: 12, color: Colors.textMuted },
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
