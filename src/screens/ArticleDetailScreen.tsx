import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, ActivityIndicator
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { getArticleById, type Article } from '../services/content';

interface Props {
  articleId: string;
  onBack?: () => void;
}

export const ArticleDetailScreen: React.FC<Props> = ({ articleId, onBack }) => {
  const { colors } = useTheme();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleById(articleId).then(a => {
      setArticle(a);
      setLoading(false);
    });
  }, [articleId]);

  const handleShare = async () => {
    if (!article) return;
    await Share.share({
      title: article.title,
      message: `${article.title}\n\n${article.summary}\n\nVia EVX Health Coach`,
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
    shareBtn: { padding: 4 },
    shareText: { fontSize: 16, color: colors.primary },
    scroll: { padding: 24 },
    emoji: { fontSize: 52, marginBottom: 16 },
    category: {
      alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 8, backgroundColor: colors.primary + '20', marginBottom: 12,
    },
    categoryText: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 34, marginBottom: 8 },
    meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 24 },
    body: { fontSize: 16, color: colors.text, lineHeight: 26 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 32 },
    tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.card },
    tagText: { fontSize: 12, color: colors.textSecondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.textSecondary }}>Article not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareText}>Share ↑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>{article.emoji}</Text>
        <View style={styles.category}>
          <Text style={styles.categoryText}>{article.category}</Text>
        </View>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.meta}>📖 {article.read_time_minutes} min read · EVX Health</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{article.body}</Text>
        {article.tags.length > 0 && (
          <View style={styles.tags}>
            {article.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ArticleDetailScreen;
