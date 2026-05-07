import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONTS, RADIUS, TRIAL_LIMIT, APP_NAME } from '../lib/theme';import { store, Profile } from '../lib/store';

const TILES = [
  { id: 'content', icon: '✂️', title: 'Content', desc: 'Daily posts & hooks', tint: C.gold },
  { id: 'photo', icon: '📸', title: 'Photo Caption', desc: 'AI reads your photo', tint: C.ig },
  { id: 'before', icon: '🖼️', title: 'Before & After', desc: 'Transformation posts', tint: C.tt },
  { id: 'calendar', icon: '📅', title: '7-Day Calendar', desc: 'Auto-plan your week', tint: C.gold },
  { id: 'scripts', icon: '🎬', title: 'TikTok Scripts', desc: 'Word-for-word', tint: C.tt },
  { id: 'hashtags', icon: '🔥', title: 'Hashtags', desc: 'Custom by city', tint: C.ig },
  { id: 'replies', icon: '💬', title: 'DM Replies', desc: 'Perfect responses', tint: C.gold },
  { id: 'tracker', icon: '📊', title: 'Tracker', desc: 'AI performance review', tint: C.purple },
  { id: 'pricing', icon: '💰', title: 'Pricing Coach', desc: 'What to charge', tint: C.success },
  { id: 'refer', icon: '🤝', title: 'Refer & Earn', desc: 'Free months', tint: C.gold },
  { id: 'help', icon: '❓', title: 'How To Use', desc: 'Step-by-step', tint: C.textDim },
];

export default function Hub() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gens, setGens] = useState(0);
  const [paid, setPaid] = useState(false);

  const load = useCallback(async () => {
    const [p, g, pd] = await Promise.all([
      store.getProfile(), store.getGens(), store.getPaid(),
    ]);
    setProfile(p);
    setGens(g);
    setPaid(pd);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const trialsLeft = Math.max(0, TRIAL_LIMIT - gens);

  const openTool = (id: string) => {
    router.push(`/tool/${id}` as any);
  };

  const handleSettings = () => {
    Alert.alert('Settings', `Trials used: ${gens}/${TRIAL_LIMIT}${paid ? ' · 👑 PRO' : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '🔄 Reset Trial Counter',
        onPress: async () => {
          await store.setGens(0);
          load();
        },
      },
      {
        text: paid ? '🔒 Lock Pro (testing)' : '👑 Unlock Pro (testing)',
        onPress: async () => {
          await store.setPaid(!paid);
          load();
        },
      },
      {
        text: '🗑️ Reset Everything',
        style: 'destructive',
        onPress: async () => {
          await store.resetAll();
          router.replace('/paywall');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 60 }} testID="hub-screen">
        {/* HEADER */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient
              colors={[C.gold, C.goldDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.logo}>
              <Text style={{ fontSize: 18 }}>💈</Text>
            </LinearGradient>
            <View>
              <Text style={s.brand}>{APP_NAME}</Text>
              <Text style={s.brandSub}>{profile?.biz || 'Your Brand'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSettings} style={s.settingsBtn} testID="settings-btn">
            <Text style={{ color: C.textDim, fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* HERO BANNER */}
        <View style={s.heroBanner}>
          <Text style={s.heroLabel}>WELCOME BACK{profile?.name ? `, ${profile.name.toUpperCase()}` : ''}</Text>
          <Text style={s.heroTitle}>WHAT ARE WE{'\n'}MAKING TODAY?</Text>
          {!paid && (
            <View style={s.trialPill}>
              <Text style={s.trialPillText}>
                🎁 {trialsLeft} FREE GEN{trialsLeft !== 1 ? 'S' : ''} LEFT
              </Text>
            </View>
          )}
          {paid && (
            <View style={[s.trialPill, { backgroundColor: C.gold + '22', borderColor: C.gold + '66' }]}>
              <Text style={[s.trialPillText, { color: C.gold }]}>👑 PRO ACTIVE · UNLIMITED</Text>
            </View>
          )}
        </View>

        {/* TILES GRID */}
        <View style={s.gridWrap}>
          {TILES.map((t, i) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => openTool(t.id)}
              testID={`tile-${t.id}`}
              activeOpacity={0.8}
              style={[s.tile, { borderTopColor: t.tint }]}>
              <Text style={s.tileIcon}>{t.icon}</Text>
              <Text style={s.tileTitle}>{t.title}</Text>
              <Text style={s.tileDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.borderDim,
  },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontFamily: FONTS.display, fontSize: 18, color: C.gold, letterSpacing: 2, lineHeight: 20 },
  brandSub: { fontFamily: FONTS.body, fontSize: 11, color: C.textMute },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBanner: { paddingHorizontal: 16, paddingTop: 26, paddingBottom: 18 },
  heroLabel: { color: C.textMute, fontFamily: FONTS.display, letterSpacing: 2, fontSize: 12, marginBottom: 6 },
  heroTitle: { color: C.white, fontFamily: FONTS.display, fontSize: 32, letterSpacing: 1, lineHeight: 34, marginBottom: 14 },
  trialPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.success + '22',
    borderColor: C.success + '66',
    borderWidth: 1, borderRadius: RADIUS.pill,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  trialPillText: { color: C.success, fontFamily: FONTS.display, letterSpacing: 1.5, fontSize: 12 },
  gridWrap: {
    paddingHorizontal: 12, marginTop: 8,
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  tile: {
    width: '47.6%',
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1, borderColor: C.border,
    borderTopWidth: 3,
    minHeight: 120,
  },
  tileIcon: { fontSize: 28, marginBottom: 10 },
  tileTitle: { fontFamily: FONTS.display, fontSize: 16, color: C.white, letterSpacing: 1.2, marginBottom: 4 },
  tileDesc: { fontFamily: FONTS.body, fontSize: 11, color: C.textMute, lineHeight: 15 },
});
