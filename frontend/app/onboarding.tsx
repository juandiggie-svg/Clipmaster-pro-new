import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Inp, Label, Chip } from '../components/ui';
import { C, FONTS, RADIUS } from '../lib/theme';
import { store } from '../lib/store';

const NICHES = ['Barbershop', 'Hair Salon', 'Nail Tech', 'Lash Tech', 'Braiding', 'Esthetics', 'Tattoo Studio', 'Other'];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [biz, setBiz] = useState('');
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [booking, setBooking] = useState('');

  const finish = async () => {
    await store.setProfile({ name, biz, niche, city, booking });
    router.replace('/hub');
  };

  const canContinue =
    (step === 1 && name.trim() && biz.trim()) ||
    (step === 2 && !!niche) ||
    (step === 3 && !!city.trim());

  const next = () => (step < 3 ? setStep(step + 1) : finish());

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.root} keyboardShouldPersistTaps="handled" testID="onboarding-screen">
          <View style={s.progressRow}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[s.progressBar, { backgroundColor: i <= step ? C.gold : C.border }]}
              />
            ))}
          </View>

          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>💈</Text>
            <Text style={s.title}>
              {step === 1 ? "LET'S SET UP YOUR BRAND" : step === 2 ? "WHAT'S YOUR NICHE?" : 'ALMOST DONE!'}
            </Text>
            <Text style={s.subtitle}>
              {step === 1
                ? 'This personalizes every piece of content we create for you.'
                : step === 2
                ? "We'll tailor all content to your specific industry."
                : 'Last two details to make your content hyper-local.'}
            </Text>
          </View>

          <View style={s.card}>
            {step === 1 && (
              <>
                <Label>YOUR FIRST NAME</Label>
                <Inp value={name} onChangeText={setName} placeholder="e.g. Juan" testID="input-name" />
                <View style={{ height: 14 }} />
                <Label>BUSINESS NAME</Label>
                <Inp value={biz} onChangeText={setBiz} placeholder="e.g. Juan Stewart Barbering" testID="input-biz" />
              </>
            )}
            {step === 2 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {NICHES.map(n => (
                  <Chip key={n} label={n} active={niche === n} onPress={() => setNiche(n)} testID={`niche-${n}`} />
                ))}
              </View>
            )}
            {step === 3 && (
              <>
                <Label>YOUR CITY & STATE</Label>
                <Inp value={city} onChangeText={setCity} placeholder="e.g. Cleveland, Ohio" testID="input-city" />
                <View style={{ height: 14 }} />
                <Label>BOOKING LINK OR PHONE (OPTIONAL)</Label>
                <Inp value={booking} onChangeText={setBooking} placeholder="e.g. juansbarbering.com" testID="input-booking" />
              </>
            )}
          </View>

          <TouchableOpacity onPress={next} disabled={!canContinue} testID="continue-btn" activeOpacity={0.85}>
            {canContinue ? (
              <LinearGradient colors={[C.gold, C.goldDark]} style={s.btn}>
                <Text style={s.btnText}>{step < 3 ? 'CONTINUE →' : "🚀 LET'S GO"}</Text>
              </LinearGradient>
            ) : (
              <View style={[s.btn, { backgroundColor: C.surface2 }]}>
                <Text style={[s.btnText, { color: C.textFaint }]}>{step < 3 ? 'CONTINUE →' : "🚀 LET'S GO"}</Text>
              </View>
            )}
          </TouchableOpacity>

          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} style={s.backBtn}>
              <Text style={s.backText}>← BACK</Text>
            </TouchableOpacity>
          )}
          <Text style={s.stepCount}>Step {step} of 3</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 32 },
  progressBar: { flex: 1, height: 3, borderRadius: 3 },
  title: {
    fontFamily: FONTS.display, fontSize: 26, color: C.gold, letterSpacing: 4,
    marginTop: 8, marginBottom: 6, textAlign: 'center',
  },
  subtitle: { color: C.textMute, fontSize: 13, fontFamily: FONTS.body, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },
  card: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.lg, padding: 20, marginBottom: 16,
  },
  btn: { paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center' },
  btnText: { fontFamily: FONTS.display, fontSize: 17, color: '#000', letterSpacing: 3 },
  backBtn: {
    paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: C.border, marginTop: 10,
  },
  backText: { color: C.textDim, fontFamily: FONTS.display, fontSize: 13, letterSpacing: 2 },
  stepCount: { color: C.textFaint, fontSize: 11, textAlign: 'center', marginTop: 14, fontFamily: FONTS.body },
});
