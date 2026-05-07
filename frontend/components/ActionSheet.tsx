import React, { ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, FONTS, RADIUS } from '../lib/theme';

export type SheetOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  primary?: boolean;
};

export function ActionSheet({
  visible, title, message, options, onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  options: SheetOption[];
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={onClose}
        testID="sheet-backdrop">
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.message}>{message}</Text> : null}
          <View style={{ marginTop: 14, gap: 8 }}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { onClose(); setTimeout(opt.onPress, 50); }}
                testID={`sheet-opt-${i}`}
                style={[
                  s.btn,
                  opt.primary && { backgroundColor: C.gold, borderColor: C.gold },
                  opt.destructive && { backgroundColor: '#1a0000', borderColor: C.error },
                ]}>
                <Text style={[
                  s.btnText,
                  opt.primary && { color: '#000' },
                  opt.destructive && { color: C.error },
                ]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={onClose} style={[s.btn, { marginTop: 4 }]} testID="sheet-cancel">
              <Text style={[s.btnText, { color: C.textMute }]}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: C.gold + '44',
  },
  title: {
    color: C.gold,
    fontFamily: FONTS.display,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: C.textDim,
    fontSize: 13,
    fontFamily: FONTS.body,
    textAlign: 'center',
    lineHeight: 19,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  btnText: {
    fontFamily: FONTS.display,
    color: C.white,
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
