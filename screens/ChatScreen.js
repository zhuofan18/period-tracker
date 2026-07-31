import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const FUNCTION_URL   = 'https://znmgfnbrdbxiwjnvywdh.supabase.co/functions/v1/chat';
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubWdmbmJyZGJ4aXdqbnZ5d2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzUwNTksImV4cCI6MjA5ODE1MTA1OX0.GneTn6xcMAWVadRg_N3QOkqzqDm1D3VwghrfyFHhqMw';

const GREETING = "Hi! I'm Luna, your women's health assistant 🌸 I can help with questions about your cycle, symptoms, or any women's health topics. What's on your mind?";

export default function ChatScreen({ navigation }) {
  const { theme } = useTheme();
  const s = styles(theme);

  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const listRef = useRef(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    // Skip the initial greeting; Claude API requires messages to start with 'user'
    const apiMessages = updated.slice(1).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'apikey': SUPABASE_ANON,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      const msg = err?.message || 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${msg}\n\nIf this says "ANTHROPIC_API_KEY", go to Supabase → Edge Functions → Secrets and make sure ANTHROPIC_API_KEY is set.` },
      ]);
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.row, isUser ? s.rowUser : s.rowAI]}>
        {!isUser && (
          <View style={s.avatar}>
            <Text style={s.avatarEmoji}>🌸</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAI]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.headerAvatarSmall}>
              <Text style={{ fontSize: 16 }}>🌸</Text>
            </View>
            <View>
              <Text style={s.headerTitle}>Luna</Text>
              <Text style={s.headerSub}>Women's Health Assistant</Text>
            </View>
          </View>
          <View style={s.onlinePill}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={s.typingRow}>
            <View style={s.avatar}>
              <Text style={s.avatarEmoji}>🌸</Text>
            </View>
            <View style={s.typingBubble}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Ask me about your health..."
            placeholderTextColor={theme.placeholder}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            {...Platform.select({
              web: {
                onKeyDown: (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                },
              },
              default: {},
            })}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (theme) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: theme.card },
  screen: { flex: 1, backgroundColor: theme.surface },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: theme.border,
    gap: 10,
  },
  backBtn:         { padding: 2 },
  backArrow:       { fontSize: 22, color: theme.text },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: theme.text },
  headerSub:    { fontSize: 11, color: theme.muted },
  onlinePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  onlineText:   { fontSize: 11, color: '#16a34a', fontWeight: '600' },

  list: { padding: 16, gap: 12, paddingBottom: 8 },

  row:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAI:   { justifyContent: 'flex-start' },

  avatar:      { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji: { fontSize: 14 },

  bubble:        { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:    { backgroundColor: '#e75480', borderBottomRightRadius: 4 },
  bubbleAI:      {
    backgroundColor: theme.card, borderBottomLeftRadius: 4,
    ...Platform.select({
      web:     { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
    }),
  },
  bubbleText:     { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI:   { color: theme.text },

  typingRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { backgroundColor: theme.card, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 18, paddingVertical: 12 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: theme.card,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: theme.text,
    backgroundColor: theme.inputBg,
    maxHeight: 100,
  },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e75480', alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: theme.muted + '55' },
  sendIcon:   { color: '#fff', fontSize: 18, fontWeight: '700' },
});
