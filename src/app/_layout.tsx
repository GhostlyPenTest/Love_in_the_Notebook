import { ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { paperColors } from '@/constants/theme';
import { CoupleProvider } from '@/lib/couple/CoupleProvider';
import { configureNotificationHandler } from '@/lib/push/notifications';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

const gameHeaderOptions = (title: string) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: paperColors.page },
  headerTintColor: paperColors.pencil,
  headerTitleStyle: { fontFamily: 'PatrickHand_400Regular' as const },
  headerShadowVisible: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PatrickHand_400Regular, ArchitectsDaughter_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <CoupleProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="(notebook)" />
        <Stack.Screen name="game/tic-tac-toe" options={gameHeaderOptions('tic-tac-toe')} />
        <Stack.Screen name="game/word-chain" options={gameHeaderOptions('word chain')} />
        <Stack.Screen name="game/trivia" options={gameHeaderOptions('daily duel trivia')} />
        <Stack.Screen name="game/battleship" options={gameHeaderOptions('battleship')} />
      </Stack>
    </CoupleProvider>
  );
}
