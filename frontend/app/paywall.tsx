import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground,
  Linking, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONTS, RADIUS, SPACE, TRIAL_LIMIT, PRICE, APP_NAME, STRIPE_LINK } from '../lib/theme';
import { store } from '../lib/store';

const FEATURES = [
  { icon: '✂️', title: 'Content Generator', desc: 'Daily posts, hooks & promos' },
  { icon: '📸', title: 'AI Photo Caption', desc: 'Upload a photo, AI writes the caption' },
  { icon: '🖼️', title: 'Before & After', desc: 'Transformation posts that go viral' },
  { icon: '📅', title: 'Weekly Calendar', desc: 'Auto-plan 7 days of content' },
  { icon: '🎬', title: 'TikTok Scripts', desc: 'Word-for-word video scripts' },
  { icon: '🔥', title: 'Hashtag Strategy', desc: 'Custom tags by niche & city' },
  { icon: '💬', title: 'DM Reply Generator', desc: 'Perfect replies for bookings' },
  { icon: '📊', title: 'Performance Tracker', desc: 'AI analyzes what works' },
  { icon: '💰', title: 'Pricing Coach', desc: 'Know what to charge' },
  { icon: '🤝', title: 'Refer & Earn', desc: 'Free months for referrals' },
  { icon: '❓', title: 'How To Use Guide', desc: 'Step-by-step walkthroughs' },
];

const HERO_IMG = 'https://images.unsplash.com/photo-1572663459735-75425e957ab9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwYmFyYmVyc2hvcCUyMGludGVyaW9yJTIwZGFya3xlbnwwfHx8fDE3NzgxNjYyNTJ8MA&ixlib=rb-4.1.0&q=85';

export default function Paywall() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paywall?: string }>();
  const isPaywall = params.paywall === '1';
  const [trialsLeft, setTrialsLeft] = useState(TRIAL_LIMIT);

  useEffect(() => {
    (async () => {
      const g = await store.getGens();
      setTrialsLeft(Math.max(0, TRIAL_LIMIT - g));
    })();
  }, []);

  const handleStripe = () => Linking.openURL(STRIPE_LINK);

  const handleStart = async () => {
    const profile = await store.getProfile();
    if (profile) router.replace('/hub');
    else router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }} testID="paywall-screen">
        {/* HERO */}
        <ImageBackground source={{ uri: HERO_IMG }} style={s.hero} imageStyle={{ opacity: 0.35 }}>
          <LinearGradient
            colors={['rgba(5,5,5,0.6)', 'rgba(5,5,5,0.95)', C.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.heroInner}>
            <View style={s.logoCircle}>
              <Text style={{ fontSize: 36 }}>💈</Text>
            </View>
            <Text style={s.brand}>{APP_NAME}</Text>
            <Text style={s.tagline}>The #1 social tool for</Text>
            <Text style={s.taglineBold}>Barbers · Stylists · Beauty Pros</Text>

            {isPaywall ? (
              <View style={s.lockBanner}>
                <Text style={s.lockTitle}>🔒 TRIAL ENDED</Text>
                <Text style={s.lockText}>You've used your 3 free generations. Subscribe to keep growing.</Text>
              </View>
            ) : (
              <View style={s.trialBanner}>
                <Text style={s.trialText}>
                  🎁 {trialsLeft} FREE GENERATION{trialsLeft !== 1 ? 'S' : ''} REMAINING
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>

        {/* PRICE CARD */}
        <View style={s.priceCardWrap}>
          <View style={s.priceCard}>
            <View style={s.popularTag}>
              <Text style={s.popularText}>MOST POPULAR</Text>
            </View>
            <Text style={s.subLabel}>MONTHLY SUBSCRIPTION</Text>
            <View style={s.priceRow}>
              <Text style={s.priceBig}>{PRICE}</Text>
              <Text style={s.priceSmall}>/mo</Text>
            </View>
            {[
              'Unlimited content generation',
              'All 11 automation tools',
              'Weekly calendar planner',
              'TikTok script writer',
              'Custom hashtag strategy',
              'DM reply generator',
              'Works for ANY beauty niche',
              'Cancel anytime',
            ].map((f, i) => (
              <View key={i} style={s.featRow}>
                <Text style={s.checkmark}>✓</Text>
                <Text style={s.featText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity onPress={handleStripe} testID="subscribe-btn" activeOpacity={0.85}>
              <LinearGradient
                colors={[C.gold, C.goldDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.subBtn}>
                <Text style={s.subBtnText}>🔓 SUBSCRIBE NOW — {PRICE}/MO</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!isPaywall && trialsLeft > 0 && (
              <TouchableOpacity
                onPress={handleStart}
                style={s.trialBtn}
                testID="start-trial-btn"
                activeOpacity={0.85}>
                <Text style={s.trialBtnText}>
                  USE MY {trialsLeft} FREE TRIAL{trialsLeft !== 1 ? 'S' : ''} FIRST
                </Text>
              </TouchableOpacity>
            )}

            <Text style={s.secureNote}>Secure payment via Stripe · Cancel anytime</Text>
          </View>
        </View>

        {/* FEATURES LIST */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={s.everything}>EVERYTHING INCLUDED</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
              <Text style={s.featureCheck}>✓</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { flex: 1, backgroundColor: C.bg },
  hero: { paddingTop: 40, paddingBottom: 32, paddingHorizontal: 20 },
  heroInner: { alignItems: 'center' },
  logoCircle: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.gold, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brand: {
    fontFamily: FONTS.display, fontSize: 44, color: C.gold, letterSpacing: 6, marginBottom: 8,
  },
  tagline: { color: C.textMute, fontSize: 13, fontFamily: FONTS.body },
  taglineBold: { color: C.white, fontSize: 16, fontFamily: FONTS.bodyBold, marginTop: 2, marginBottom: 22 },
  trialBanner: {
    backgroundColor: C.success + '22',
    borderColor: C.success + '66',
    borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  trialText: { color: C.success, fontFamily: FONTS.display, letterSpacing: 2, fontSize: 13 },
  lockBanner: {
    backgroundColor: '#1a0000', borderWidth: 1, borderColor: C.ig + '66',
    borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 14, marginTop: 6,
  },
  lockTitle: { color: C.ig, fontFamily: FONTS.display, fontSize: 14, letterSpacing: 2, marginBottom: 4 },
  lockText: { color: C.textDim, fontSize: 13, fontFamily: FONTS.body, lineHeight: 18 },
  priceCardWrap: { paddingHorizontal: 16, marginTop: -12 },
  priceCard: {
    backgroundColor: C.surface, borderWidth: 2, borderColor: C.gold,
    borderRadius: RADIUS.lg, padding: 24,
  },
  popularTag: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  popularText: { color: '#000', fontSize: 10, fontFamily: FONTS.display, letterSpacing: 1 },
  subLabel: { color: C.textMute, fontFamily: FONTS.display, letterSpacing: 2, fontSize: 12, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 18 },
  priceBig: { fontFamily: FONTS.display, fontSize: 56, color: C.gold, lineHeight: 56 },
  priceSmall: { color: C.textMute, fontSize: 14, fontFamily: FONTS.body },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkmark: { color: C.success, fontSize: 16 },
  featText: { color: C.white, fontSize: 13, fontFamily: FONTS.body },
  subBtn: {
    paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 14,
  },
  subBtnText: { color: '#000', fontFamily: FONTS.display, fontSize: 17, letterSpacing: 2 },
  trialBtn: {
    paddingVertical: 13, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', marginTop: 10,
  },
  trialBtnText: { color: C.textDim, fontFamily: FONTS.display, fontSize: 13, letterSpacing: 2 },
  secureNote: { color: C.textFaint, fontSize: 11, textAlign: 'center', marginTop: 12, fontFamily: FONTS.body },
  everything: {
    fontFamily: FONTS.display, color: C.textMute, fontSize: 13, letterSpacing: 3,
    textAlign: 'center', marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
  },
  featureIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  featureTitle: { color: C.white, fontFamily: FONTS.display, fontSize: 15, letterSpacing: 1 },
  featureDesc: { color: C.textMute, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  featureCheck: { color: C.success, fontSize: 16 },
});
