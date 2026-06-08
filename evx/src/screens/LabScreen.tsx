import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { labService } from '../services/supabase';
import { analyzeLabReport } from '../services/ai';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import { EVXLoader } from '../components/EVXLoader';
import type { LabReport, LabAnalysis } from '../types';

interface Props { navigation?: any; }

export const LabScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      labService.list(user.id).then(setReports).finally(() => setLoading(false));
    }
  }, []);

  const handlePickFile = async () => {
    try {
      let result: any;
      if (Platform.OS !== 'web') {
        const DocumentPicker = await import('expo-document-picker');
        result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
      } else {
        Alert.alert('Web Upload', 'Please use the mobile app to upload lab reports for the best experience.');
        return;
      }

      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setUploading(true);

      // Upload to Supabase storage
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileUrl = await labService.uploadFile(user!.id, blob, file.name);

      const report = await labService.create({
        user_id: user!.id,
        file_url: fileUrl,
        file_type: file.mimeType?.includes('pdf') ? 'pdf' : 'image',
        file_name: file.name,
        status: 'pending',
      });

      setReports([report, ...reports]);
      setSelectedReport(report);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (report: LabReport) => {
    if (!healthProfile) return;
    setAnalyzing(true);

    try {
      await labService.updateStatus(report.id, 'processing');

      // In production: extract text from PDF/image via OCR
      // For MVP: use file name + user context
      const mockLabText = `Lab Report: ${report.file_name}\nDate: ${report.created_at?.split('T')[0]}\nPatient requires detailed analysis based on uploaded document.`;

      const result = await analyzeLabReport(healthProfile, mockLabText);

      const savedAnalysis = await labService.saveAnalysis({
        user_id: user!.id,
        lab_report_id: report.id,
        summary: result.summary || '',
        educational_explanations: result.educational_explanations || [],
        lifestyle_recommendations: result.lifestyle_recommendations || [],
        risk_awareness_notes: result.risk_awareness_notes || [],
        disclaimer: result.disclaimer || 'This information is educational and not medical advice.',
      });

      await labService.updateStatus(report.id, 'completed');
      setReports(reports.map(r => r.id === report.id ? { ...r, status: 'completed' } : r));
      setAnalysis(savedAnalysis);
    } catch (err: any) {
      await labService.updateStatus(report.id, 'failed');
      Alert.alert('Analysis failed', err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectReport = async (report: LabReport) => {
    setSelectedReport(report);
    setAnalysis(null);
    if (report.status === 'completed') {
      const a = await labService.getAnalysis(report.id);
      setAnalysis(a);
    }
  };

  if (loading) return <EVXLoader fullScreen message="Loading lab reports..." />;

  if (selectedReport && analysis) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => { setSelectedReport(null); setAnalysis(null); }}>
            <Text style={{ color: colors.primary, fontSize: 22 }}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <EVXCard style={{ marginBottom: 16, borderColor: `${colors.warning}40` }}>
          <Text style={{ color: colors.warning, fontSize: fontSize.xs, fontWeight: '700', marginBottom: 4 }}>
            ⚕️ IMPORTANT DISCLAIMER
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{analysis.disclaimer}</Text>
        </EVXCard>

        {/* Summary */}
        <EVXCard glowColor={colors.accentPurple} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.accentPurple, fontWeight: '800', fontSize: fontSize.lg, marginBottom: 8 }}>
            🔬 Lab Summary
          </Text>
          <Text style={{ color: colors.text, fontSize: fontSize.sm, lineHeight: 22 }}>{analysis.summary}</Text>
        </EVXCard>

        {/* Markers */}
        {analysis.educational_explanations?.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MARKERS ANALYZED</Text>
            {analysis.educational_explanations.map((marker, i) => (
              <EVXCard key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{marker.name}</Text>
                  <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' }}>{marker.value}</Text>
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginBottom: 6 }}>
                  Normal: {marker.normal_range}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{marker.explanation}</Text>
                {marker.lifestyle_tip && (
                  <Text style={{ color: colors.accentGreen, fontSize: fontSize.xs, marginTop: 6, fontWeight: '600' }}>
                    💡 {marker.lifestyle_tip}
                  </Text>
                )}
              </EVXCard>
            ))}
          </>
        )}

        {/* Lifestyle Recommendations */}
        {analysis.lifestyle_recommendations?.length > 0 && (
          <EVXCard style={{ marginTop: 8 }}>
            <Text style={{ color: colors.accentGreen, fontWeight: '700', fontSize: fontSize.sm, marginBottom: 10 }}>
              🌿 Lifestyle Recommendations
            </Text>
            {analysis.lifestyle_recommendations.map((rec, i) => (
              <Text key={i} style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 6 }}>
                {i + 1}. {rec}
              </Text>
            ))}
          </EVXCard>
        )}

        {/* Risk Notes */}
        {analysis.risk_awareness_notes?.length > 0 && (
          <EVXCard style={{ marginTop: 8, borderColor: `${colors.warning}30` }}>
            <Text style={{ color: colors.warning, fontWeight: '700', fontSize: fontSize.sm, marginBottom: 10 }}>
              ⚠️ Discuss with Your Doctor
            </Text>
            {analysis.risk_awareness_notes.map((note, i) => (
              <Text key={i} style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 6 }}>
                • {note}
              </Text>
            ))}
          </EVXCard>
        )}
      </ScrollView>
    );
  }

  if (selectedReport && !analysis) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => setSelectedReport(null)}>
            <Text style={{ color: colors.primary, fontSize: 22 }}>← Back</Text>
          </TouchableOpacity>
        </View>
        <EVXCard glowColor={colors.accentPurple} style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔬</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.xl, marginBottom: 8 }}>{selectedReport.file_name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 24 }}>
            Status: {selectedReport.status}
          </Text>
          {selectedReport.status !== 'completed' && (
            <EVXButton
              title={analyzing ? 'Analyzing...' : '✦ Analyze with AI'}
              onPress={() => handleAnalyze(selectedReport)}
              loading={analyzing}
              fullWidth={false}
            />
          )}
        </EVXCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>EVX Lab 🔬</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>
          Upload & analyze your lab reports
        </Text>
      </View>

      <EVXCard style={{ marginBottom: 20, borderColor: `${colors.warning}30` }}>
        <Text style={{ color: colors.warning, fontSize: fontSize.xs, fontWeight: '700', marginBottom: 4 }}>
          ⚕️ DISCLAIMER
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>
          EVX Lab provides educational health information only. This is not medical advice. Always consult a healthcare provider for diagnosis and treatment.
        </Text>
      </EVXCard>

      <EVXButton
        title={uploading ? 'Uploading...' : '📄 Upload Lab Report (PDF or Image)'}
        onPress={handlePickFile}
        loading={uploading}
        variant="secondary"
        style={{ marginBottom: 24 }}
      />

      {reports.length === 0 ? (
        <EVXCard style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔬</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 }]}>
            No lab reports yet
          </Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }]}>
            Upload a PDF or image of your lab results and EVX will provide educational insights.
          </Text>
        </EVXCard>
      ) : (
        reports.map(r => (
          <TouchableOpacity key={r.id} onPress={() => handleSelectReport(r)} activeOpacity={0.85}>
            <EVXCard style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 28, marginRight: 12 }}>{r.file_type === 'pdf' ? '📄' : '🖼️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>{r.file_name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 2 }}>
                    {r.created_at?.split('T')[0]}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: r.status === 'completed'
                    ? `${colors.accentGreen}20`
                    : r.status === 'processing'
                      ? `${colors.warning}20`
                      : `${colors.textTertiary}20`,
                }]}>
                  <Text style={{
                    color: r.status === 'completed' ? colors.accentGreen : r.status === 'processing' ? colors.warning : colors.textTertiary,
                    fontSize: fontSize.xs, fontWeight: '700',
                  }}>
                    {r.status === 'completed' ? '✓ Done' : r.status === 'processing' ? '⏳' : 'Pending'}
                  </Text>
                </View>
              </View>
            </EVXCard>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingTop: 56, paddingBottom: 16 },
  title: { fontWeight: '800' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
