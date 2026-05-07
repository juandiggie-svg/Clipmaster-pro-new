import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { C, FONTS, TRIAL_LIMIT } from '../../lib/theme';
import { store, Profile } from '../../lib/store';
import { ActionSheet } from '../../components/ActionSheet';
import {
  ContentTool, CalendarTool, ScriptsTool, HashtagsTool, RepliesTool, PricingTool,
} from '../../components/tools-text';
import {
  PhotoTool, BeforeAfterTool, TrackerTool, ReferTool, HelpTool,
} from '../../components/tools-rich';

const META: Record<string, { title: string; subtitle: string; icon: string }> = {
  content:  { title: 'CONTENT GENERATOR',  subtitle: 'Daily posts, hooks & promos',     icon: '✂️' },
  photo:    { title: 'AI PHOTO CAPTION',   subtitle: 'Upload — AI writes the caption',   icon: '📸' },
  before:   { title: 'BEFORE & AFTER',     subtitle: 'Transformation posts',             icon: '🖼️' },
  calendar: { title: '7-DAY CALENDAR',     subtitle: 'Auto-plan your week',              icon: '📅' },
  scripts:  { title: 'TIKTOK SCRIPTS',     subtitle: 'Word-for-word video scripts',      icon: '🎬' },
  hashtags: { title: 'HASHTAG STRATEGY',   subtitle: 'Custom by niche & city',           icon: '🔥' },
  replies:  { title: 'DM REPLIES',         subtitle: 'Perfect responses',                icon: '💬' },
  tracker:  { title: 'PERFORMANCE TRACKER', subtitle: 'AI analyzes what works',          icon: '📊' },
  pricing:  { title: 'PRICING COACH',      subtitle: 'What to charge',                   icon: '💰' },
  refer:    { title: 'REFER & EARN',       subtitle: 'Free months for friends',          icon: '🤝' },
  help:     { title: 'HOW TO USE',         subtitle: 'Step-by-step walkthroughs',        icon: '❓' },
};

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [trialEndedOpen, setTrialEndedOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await store.getProfile();
      setProfile(p);
      setReady(true);
    })();
  }, []);

  const onGenerate = useCallback(async (): Promise<boolean> => {
    const paid = await store.getPaid();
    if (paid) return true;
    const gens = await store.getGens();
    if (gens >= TRIAL_LIMIT) {
      setTrialEndedOpen(true);
      return false;
    }
    await store.setGens(gens + 1);
    return true;
  }, []);

  const meta = META[id as string] || { title: 'TOOL', subtitle: '', icon: '✨' };

  const renderTool = () => {
    if (!ready) return null;
    switch (id) {
      case 'content':  return <ContentTool   profile={profile} onGenerate={onGenerate} />;
      case 'photo':    return <PhotoTool     profile={profile} onGenerate={onGenerate} />;
      case 'before':   return <BeforeAfterTool profile={profile} onGenerate={onGenerate} />;
      case 'calendar': return <CalendarTool  profile={profile} onGenerate={onGenerate} />;
      case 'scripts':  return <ScriptsTool   profile={profile} onGenerate={onGenerate} />;
      case 'hashtags': return <HashtagsTool  profile={profile} onGenerate={onGenerate} />;
      case 'replies':  return <RepliesTool   profile={profile} onGenerate={onGenerate} />;
      case 'tracker':  return <TrackerTool   profile={profile} onGenerate={onGenerate} />;
      case 'pricing':  return <PricingTool   profile={profile} onGenerate={onGenerate} />;
      case 'refer':    return <ReferTool     profile={profile} />;
      case 'help':     return <HelpTool />;
      default:
        return <Text style={{ color: C.textDim, padding: 20 }}>Unknown tool: {id}</Text>;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} testID="back-btn" style={s.backBtn}>
            <Text style={{ color: C.gold, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.headerTitle}>{meta.icon} {meta.title}</Text>
            <Text style={s.headerSub}>{meta.subtitle}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {renderTool()}
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={trialEndedOpen}
        title="🔒 TRIAL ENDED"
        message="You've used all 3 free generations. Reset your trial counter from the home screen ⚙️ menu, or subscribe for unlimited generations."
        options={[
          {
            label: '🔄 RESET TRIALS NOW',
            primary: true,
            onPress: async () => { await store.setGens(0); },
          },
          {
            label: '🔓 SEE PLANS',
            onPress: () => router.replace({ pathname: '/paywall', params: { paywall: '1' } } as any),
          },
        ]}
        onClose={() => setTrialEndedOpen(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderDim,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: C.gold, fontFamily: FONTS.display, fontSize: 17, letterSpacing: 2 },
  headerSub: { color: C.textMute, fontSize: 11, fontFamily: FONTS.body, marginTop: 2 },
  content: { padding: 16, paddingBottom: 60 },
});
