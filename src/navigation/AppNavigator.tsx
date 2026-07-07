import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useAppStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { LabScreen } from '../screens/LabScreen';
import { DailyPlanScreen } from '../screens/DailyPlanScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EducationScreen } from '../screens/EducationScreen';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';

type Tab = 'Dashboard' | 'Workout' | 'Nutrition' | 'Learn' | 'More';
type MoreScreen = 'Lab' | 'DailyPlan' | 'Progress' | 'Settings';

const TAB_CONFIG: { key: Tab; emoji: string; label: string }[] = [
  { key: 'Dashboard', emoji: '🏠', label: 'Home' },
  { key: 'Workout',   emoji: '💪', label: 'Train' },
  { key: 'Nutrition', emoji: '🥗', label: 'Eat' },
  { key: 'Learn',     emoji: '📚', label: 'Learn' },
  { key: 'More',      emoji: '⚡', label: 'More' },
];

export const AppNavigator: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [moreScreen, setMoreScreen] = useState<MoreScreen | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Splash
  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // Auth
  if (!user) return <LoginScreen />;

  // Onboarding
  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={() => setHasOnboarded(true)} />;
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
      paddingTop: 8,
    },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
    tabEmoji: { fontSize: 20 },
    tabLabel: { fontSize: 10, fontWeight: '600' },
    moreMenu: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: colors.background, zIndex: 10,
    },
    moreHeader: {
      flexDirection: 'row', alignItems: 'center', padding: 20,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    moreTitle: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
    moreGrid: { padding: 20, gap: 12 },
    moreCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    moreCardEmoji: { fontSize: 28 },
    moreCardLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    moreCardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  });

  const MORE_ITEMS: { screen: MoreScreen; emoji: string; label: string; sub: string }[] = [
    { screen: 'Lab',       emoji: '🧬', label: 'Lab Reports',   sub: 'Upload & analyze your results' },
    { screen: 'DailyPlan', emoji: '📋', label: 'Daily Plan',    sub: 'Your AI-generated daily schedule' },
    { screen: 'Progress',  emoji: '📊', label: 'Progress',      sub: 'Track your transformation' },
    { screen: 'Settings',  emoji: '⚙️', label: 'Settings',      sub: 'Notifications, theme & account' },
  ];

  const renderContent = () => {
    // Article detail (inside Learn tab)
    if (activeTab === 'Learn' && selectedArticleId) {
      return (
        <ArticleDetailScreen
          articleId={selectedArticleId}
          onBack={() => setSelectedArticleId(null)}
        />
      );
    }

    // More sub-screens
    if (activeTab === 'More' && moreScreen) {
      const screenMap: Record<MoreScreen, React.ReactElement> = {
        Lab:       <LabScreen />,
        DailyPlan: <DailyPlanScreen />,
        Progress:  <ProgressScreen />,
        Settings:  <SettingsScreen />,
      };
      return (
        <View style={styles.moreMenu}>
          <View style={styles.moreHeader}>
            <TouchableOpacity onPress={() => setMoreScreen(null)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', marginRight: 16 }}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.moreTitle}>{moreScreen}</Text>
          </View>
          <View style={{ flex: 1 }}>{screenMap[moreScreen]}</View>
        </View>
      );
    }

    switch (activeTab) {
      case 'Dashboard': return <DashboardScreen />;
      case 'Workout':   return <WorkoutScreen />;
      case 'Nutrition': return <NutritionScreen />;
      case 'Learn':     return <EducationScreen onSelectArticle={a => setSelectedArticleId(a.id)} />;
      case 'More':
        return (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Text style={[styles.moreTitle, { margin: 20 }]}>More ⚡</Text>
            <View style={styles.moreGrid}>
              {MORE_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.screen}
                  style={styles.moreCard}
                  onPress={() => setMoreScreen(item.screen)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moreCardEmoji}>{item.emoji}</Text>
                  <View>
                    <Text style={styles.moreCardLabel}>{item.label}</Text>
                    <Text style={styles.moreCardSub}>{item.sub}</Text>
                  </View>
                  <Text style={{ marginLeft: 'auto', color: colors.textSecondary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default: return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      <View style={styles.tabBar}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => { setActiveTab(tab.key); setMoreScreen(null); setSelectedArticleId(null); }}
            >
              <Text style={[styles.tabEmoji, { opacity: isActive ? 1 : 0.45 }]}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default AppNavigator;
