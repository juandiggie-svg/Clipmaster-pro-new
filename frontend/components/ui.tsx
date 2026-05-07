import React, { useState, useCallback, ReactNode } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInputProps, ViewStyle, StyleProp, TextStyle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONTS, RADIUS, SPACE } from '../lib/theme';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);
  const run = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try { await fn(); }
    catch (e: any) { setError(e?.message || 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  return { loading, error, clearError, run };
}

export function useCopy() {
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const copy = useCallback(async (text: string, id: string | number) => {
    try { await Clipboard.setStringAsync(text); } catch {}
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);
  return { copiedId, copy };
}

// ─── Components ───────────────────────────────────────────────────────────────
export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

export function Inp({
  value, onChangeText, placeholder, multiline, testID, keyboardType,
}: TextInputProps & { multiline?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value as string}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.textFaint}
      multiline={multiline}
      keyboardType={keyboardType}
      testID={testID}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        s.input,
        multiline && { minHeight: 84, textAlignVertical: 'top' },
        focused && { borderColor: C.gold },
      ]}
    />
  );
}

export function Chip({
  label, active, onPress, color = C.gold, testID,
}: {
  label: string; active: boolean; onPress: () => void; color?: string; testID?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[
        s.chip,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: C.surface, borderColor: C.border },
      ]}>
      <Text style={[
        s.chipText,
        { color: active ? '#000' : C.textDim },
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({
  children, accent = C.gold, style,
}: { children: ReactNode; accent?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, { borderLeftColor: accent }, style]}>{children}</View>
  );
}

export function CopyBtn({
  text, id, copiedId, onCopy, small,
}: {
  text: string; id: string | number; copiedId: string | number | null;
  onCopy: (t: string, id: any) => void; small?: boolean;
}) {
  const done = copiedId === id;
  return (
    <TouchableOpacity
      onPress={() => onCopy(text, id)}
      testID={`copy-${id}`}
      style={[
        s.copyBtn,
        done && { backgroundColor: '#0e2a18', borderColor: C.success },
        small && { paddingHorizontal: 10, paddingVertical: 4 },
      ]}>
      <Text style={[s.copyText, done && { color: C.success }]}>
        {done ? '✓ COPIED' : 'COPY'}
      </Text>
    </TouchableOpacity>
  );
}

export function GenBtn({
  onPress, loading, label = '⚡ GENERATE', disabled, testID,
}: {
  onPress: () => void; loading?: boolean; label?: string; disabled?: boolean; testID?: string;
}) {
  const dis = loading || disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={dis}
      activeOpacity={0.85}
      testID={testID || 'gen-btn'}
      style={s.genBtnWrap}>
      {dis ? (
        <View style={[s.genBtnFlat, { backgroundColor: C.surface2 }]}>
          {loading ? (
            <ActivityIndicator color={C.gold} />
          ) : (
            <Text style={[s.genBtnText, { color: C.textFaint }]}>{label}</Text>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={[C.gold, C.goldDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.genBtnFlat}>
          <Text style={s.genBtnText}>{label}</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

export function RegenBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} testID="regen-btn" style={s.regenBtn}>
      <Text style={s.regenText}>🔄 REGENERATE</Text>
    </TouchableOpacity>
  );
}

export function Spinner({ label = 'GENERATING...' }: { label?: string }) {
  return (
    <View style={s.spinnerWrap}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={s.spinnerText}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({
  message, onRetry, onDismiss,
}: { message: string | null; onRetry?: (() => void) | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <View style={s.errorWrap} testID="error-banner">
      <Text style={s.errorIcon}>⚠️</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.errorText}>{message}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onRetry && (
            <TouchableOpacity onPress={onRetry} style={s.errorRetry} testID="error-retry">
              <Text style={s.errorRetryText}>↺ RETRY</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDismiss} style={s.errorDismiss}>
            <Text style={s.errorDismissText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

export function PlatformPill({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const isIG = p.includes('ig') || p.includes('insta');
  const isTT = p.includes('tt') || p.includes('tik');
  const color = isIG ? C.ig : isTT ? C.tt : C.gold;
  const label = isIG ? '📸 INSTAGRAM' : isTT ? '🎵 TIKTOK' : platform.toUpperCase();
  return (
    <View style={[s.pill, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[s.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.textMute,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONTS.display,
    fontSize: 13,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderDim,
    backgroundColor: 'transparent',
  },
  copyText: {
    color: C.textMute,
    fontFamily: FONTS.display,
    fontSize: 11,
    letterSpacing: 1,
  },
  genBtnWrap: { marginTop: 4 },
  genBtnFlat: {
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genBtnText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    letterSpacing: 3,
    color: '#000',
  },
  regenBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  regenText: {
    color: C.textDim,
    fontFamily: FONTS.display,
    fontSize: 13,
    letterSpacing: 2,
  },
  spinnerWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinnerText: {
    color: C.textMute,
    fontFamily: FONTS.display,
    letterSpacing: 3,
    fontSize: 12,
    marginTop: 12,
  },
  errorWrap: {
    flexDirection: 'row',
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: C.error + '66',
    borderRadius: RADIUS.sm,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  errorIcon: { fontSize: 16 },
  errorText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontFamily: FONTS.body,
    marginBottom: 8,
    lineHeight: 19,
  },
  errorRetry: {
    backgroundColor: C.gold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  errorRetryText: {
    color: '#000',
    fontFamily: FONTS.display,
    fontSize: 12,
    letterSpacing: 1,
  },
  errorDismiss: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  errorDismissText: {
    color: C.textMute,
    fontFamily: FONTS.display,
    fontSize: 12,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    color: C.textMute,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: FONTS.display,
    fontSize: 11,
    letterSpacing: 1,
  },
});

export { SPACE, RADIUS, FONTS, C };
