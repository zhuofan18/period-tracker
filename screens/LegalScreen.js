import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../utils/legalContent';
import { space, radius, shadow } from '../theme/spacing';
import { fontFamily, type } from '../theme/typography';

export default function LegalScreen({ navigation, route }) {
  const { theme } = useTheme();
  const s = styles(theme);
  const doc = route?.params?.doc === 'terms' ? 'terms' : 'privacy';
  const sections = doc === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;
  const title = doc === 'terms' ? 'Terms of Service' : 'Privacy Policy';

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {sections.map(({ heading, body }, i) => (
            <View key={heading} style={[s.section, i === sections.length - 1 && { marginBottom: 0 }]}>
              <Text style={s.sectionHeading}>{heading}</Text>
              <Text style={s.sectionBody}>{body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: space.md + 2,
    backgroundColor: theme.card,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn:     { padding: 2 },
  backArrow:   { fontSize: 22, color: theme.text },
  headerTitle: { ...type.h2, color: theme.text },
  content: { padding: space.xl, paddingBottom: space.xxl },
  card: {
    backgroundColor: theme.card, borderRadius: radius.lg, padding: space.xl,
    ...Platform.select(shadow),
  },
  section:        { marginBottom: space.lg },
  sectionHeading: { ...type.h3, color: theme.text, marginBottom: space.xs },
  sectionBody:    { ...type.body, color: theme.subtext, lineHeight: 21 },
});
