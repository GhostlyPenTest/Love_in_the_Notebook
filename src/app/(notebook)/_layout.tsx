import { Redirect, Tabs } from 'expo-router';
import { type ColorValue, Text } from 'react-native';

import { paperColors } from '@/constants/theme';
import { useCouple } from '@/lib/couple/CoupleProvider';

const TAB_ICONS: Record<string, string> = {
  status: '💌',
  mood: '☀️',
  journal: '📓',
  voice: '🎙️',
  games: '🎮',
};

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{TAB_ICONS[name] ?? '•'}</Text>;
}

/** The tabbed/swipeable "pages" of the shared notebook. */
export default function NotebookLayout() {
  const { loading, isPaired } = useCouple();

  if (loading) return null;
  if (!isPaired) return <Redirect href="/pairing" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: paperColors.inkBlue,
        tabBarInactiveTintColor: paperColors.pencilSoft,
        tabBarStyle: {
          backgroundColor: paperColors.page,
          borderTopColor: paperColors.ruleBlue,
        },
        tabBarLabelStyle: { fontFamily: 'PatrickHand_400Regular', fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="status"
        options={{ title: 'status', tabBarIcon: ({ color }) => <TabIcon name="status" color={color} /> }}
      />
      <Tabs.Screen
        name="mood"
        options={{ title: 'mood', tabBarIcon: ({ color }) => <TabIcon name="mood" color={color} /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'journal', tabBarIcon: ({ color }) => <TabIcon name="journal" color={color} /> }}
      />
      <Tabs.Screen
        name="voice"
        options={{ title: 'voice notes', tabBarIcon: ({ color }) => <TabIcon name="voice" color={color} /> }}
      />
      <Tabs.Screen
        name="games/index"
        options={{ title: 'games', tabBarIcon: ({ color }) => <TabIcon name="games" color={color} /> }}
      />
    </Tabs>
  );
}
