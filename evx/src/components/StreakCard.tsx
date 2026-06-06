import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { StreakData } from '../services/streaks';

interface Props {
  streak: StreakData;
}

const LEVEL_TITLES = [
  'Newcomer', 'Beginner', 'Rising', 'Consistent', 'Dedicated',
  'Committed', 'Warrior', 'Elite', 'Champion', 'Legend',
];

export const StreakCard: React.FC<Props> = ({ streak }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const levelTitle = LEVEL_TITLES[Math.min(streak.level - 1, LEVEL_TITLES.length - 1)];
  const nextLevelXP = Math.pow(streak.level, 2) * 100;
  const progress = Math.min(streak.xp_total / nextLevelXP, 1);

  const recentBadges = streak.badges.slice(-3);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1A1A2E' : '#F8F8FF' }]}>
      {/* Streak counter */}
      <View style={styles.row}>
        <View style={styles.streakBox}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakNumber, { color: '#FF6B35' }]}>
            {streak.current_streak}
          </Text>
          <Text style={[styles.streakLabel, { color: isDark ? '#888' : '#666' }]}>
            day streak
          </Text>
        </View>

        <View style={styles.statsCol}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Level</Text>
            <Text style={[styles.statValue, { color: '#00D4FF' }]}>
              {streak.level} · {levelTitle}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>XP</Text>
            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#111' }]}>
              {streak.xp_total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Best</Text>
            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#111' }]}>
              {streak.longest_streak}d
            </Text>
          </View>
        </View>
      </View>

      {/* XP progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: isDark ? '#2A2A3E' : '#E5E5F0' }]}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: '#00D4FF' }]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: isDark ? '#888' : '#666' }]}>
          {streak.xp_total} / {nextLevelXP} XP to Level {streak.level + 1}
        </Text>
      </View>

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <View style={styles.badgesRow}>
          {recentBadges.map((badge) => (
            <View key={badge.id} style={[styles.badge, { backgroundColor: isDark ? '#2A2A3E' : '#EEEEFF' }]}>
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={[styles.badgeName, { color: isDark ? '#CCC' : '#333' }]}>{badge.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  streakBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  streakEmoji: { fontSize: 28 },
  streakNumber: { fontSize: 40, fontWeight: '800', lineHeight: 46 },
  streakLabel: { fontSize: 12, marginTop: 2 },
  statsCol: { flex: 1, gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: '600' },
  progressContainer: { gap: 6 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, textAlign: 'right' },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeEmoji: { fontSize: 14 },
  badgeName: { fontSize: 12, fontWeight: '500' },
});

export default StreakCard;
