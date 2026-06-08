import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, ActivityIndicator
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { EVXCard } from '../components/EVXCard';
import { getArticles, getDailyTip, ARTICLE_CATEGORIES, type Article } from '../services/content';

interface Props {
  onSelectArticle?: (article: Article) => void;
}

export const EducationScreen: React.FC<Props> = ({ onSelectArticle }) => {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dailyTip = getDailyTip();

  const load = useCallback(async (category: string) => {
    try {
      const data = await getArticles(category);
      setArticles(data);
      setFiltered(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(activeCategory); }, [activeCategory, load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(articles); return; }
    const q = search.toLowerCase();
    setFiltered(articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    ));
  }, [search, articles]);

  const onRefresh = () => { setRefreshing(true); load(activeCategory); };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 16 },
    tipCard: {
      backgroundColor: colors.primary + '18', borderRadius: 16, padding: 16,
      borderLeftWidth: 3, borderLeftColor: colors.primary, marginBottom: 20,
    },
    tipLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    tipText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    searchBox: {
      backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
      fontSize: 15, color: colors.text, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    categories: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    catChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    catChipTextActive: { color: '#000' },
    articleCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    },
    articleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    articleEmoji: { fontSize: 32, width: 44, textAlign: 'center', marginTop: 2 },
    articleContent: { flex: 1 },
    articleTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4, lineHeight: 22 },
    articleSummary: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    categoryBadge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.primary + '20',
    },
    categoryText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },
    readTime: { fontSize: 12, color: colors.textSecondary },
    emptyText: { textAlign: 'center', color: colors.textSecondary, fontSize: 15, marginTop: 40 },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Learn 📚</Text>

      {/* Daily Tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>💡 Daily Tip</Text>
        <Text style={styles.tipText}>{dailyTip.emoji} {dailyTip.text}</Text>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchBox}
        placeholder="Search articles..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {ARTICLE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catChip, activeCategory === cat.key && styles.catChipActive]}
            onPress={() => { setActiveCategory(cat.key); setSearch(''); }}
          >
            <Text style={[styles.catChipText, activeCategory === cat.key && styles.catChipTextActive]}>
              {cat.emoji} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Articles */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No articles found.</Text>
      ) : (
        filtered.map(article => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => onSelectArticle?.(article)}
            activeOpacity={0.75}
          >
            <View style={styles.articleTop}>
              <Text style={styles.articleEmoji}>{article.emoji}</Text>
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
              </View>
            </View>
            <View style={styles.articleMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{article.category}</Text>
              </View>
              <Text style={styles.readTime}>📖 {article.read_time_minutes} min read</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default EducationScreen;
