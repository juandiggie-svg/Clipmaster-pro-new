import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { useFonts as useBebas, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { useFonts as useDM, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { C } from '../lib/theme';
import { store } from '../lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useBebas({ BebasNeue_400Regular });
  const [dmLoaded] = useDM({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });

  useEffect(() => {
    if (fontsLoaded && dmLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, dmLoaded]);

  if (!fontsLoaded || !dmLoaded) {
    return (
      <View style={st.boot}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'fade',
        }}
      />
    </>
  );
}

const st = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
