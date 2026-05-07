import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { C } from '../lib/theme';
import { store } from '../lib/store';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [profile, paid, gens] = await Promise.all([
        store.getProfile(),
        store.getPaid(),
        store.getGens(),
      ]);
      // Always show paywall first if no profile or trial exhausted (and unpaid)
      if (paid && profile) router.replace('/hub');
      else if (!profile) router.replace('/paywall');
      else router.replace('/hub');
    })();
  }, []);

  return (
    <View style={st.boot} testID="boot-screen">
      <ActivityIndicator color={C.gold} size="large" />
    </View>
  );
}

const st = StyleSheet.create({
  boot: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
