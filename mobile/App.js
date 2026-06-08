import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './lib/supabase';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {session ? <TodoScreen session={session} /> : <AuthScreen />}
    </SafeAreaView>
  );
}

function translateError(msg = '') {
  if (/Invalid login credentials/i.test(msg)) return 'E-posta veya şifre hatalı.';
  if (/User already registered/i.test(msg)) return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  if (/Password should be/i.test(msg)) return 'Şifre en az 6 karakter olmalı.';
  return msg;
}

function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // E-posta onayı kapalı: oturum yoksa direkt giriş yap
        if (!data.session) {
          const { error: e2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (e2) throw e2;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      setError(translateError(e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.center, { flex: 1, paddingHorizontal: 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Todo Uygulaması</Text>
        <Text style={styles.sub}>Devam etmek için giriş yap veya kayıt ol</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => { setMode('login'); setError(''); }}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Giriş Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => { setMode('signup'); setError(''); }}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@eposta.com"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="En az 6 karakter"
          placeholderTextColor="#64748b"
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
          )}
        </TouchableOpacity>

        {!!error && <Text style={styles.errorMsg}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

function TodoScreen({ session }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setTodos(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addTodo() {
    const task = text.trim();
    if (!task) return;
    setText('');
    const { error } = await supabase.from('todos').insert({ task, user_id: session.user.id });
    if (!error) load();
  }

  async function toggle(item) {
    const { error } = await supabase
      .from('todos')
      .update({ is_complete: !item.is_complete })
      .eq('id', item.id);
    if (!error) load();
  }

  async function remove(id) {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) load();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Yapılacaklar</Text>
          <Text style={styles.userEmail}>{session.user.email}</Text>
        </View>
        <TouchableOpacity style={styles.logout} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={text}
          onChangeText={setText}
          placeholder="Yeni görev ekle..."
          placeholderTextColor="#64748b"
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Henüz görev yok. İlkini ekle! 🎉</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <Pressable style={styles.checkbox} onPress={() => toggle(item)}>
                <View style={[styles.checkboxInner, item.is_complete && styles.checkboxChecked]}>
                  {item.is_complete && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
              <Text style={[styles.todoText, item.is_complete && styles.todoDone]}>
                {item.task}
              </Text>
              <TouchableOpacity onPress={() => remove(item.id)} hitSlop={10}>
                <Text style={styles.del}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#e2e8f0' },
  sub: { color: '#94a3b8', fontSize: 14, marginTop: 4, marginBottom: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: {
    flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#334155',
    borderRadius: 8, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  label: { fontSize: 13, color: '#94a3b8', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11,
    color: '#e2e8f0', fontSize: 15, marginBottom: 4,
  },
  btn: {
    backgroundColor: '#6366f1', borderRadius: 9, paddingVertical: 13,
    alignItems: 'center', marginTop: 18,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  errorMsg: {
    marginTop: 14, color: '#fca5a5', fontSize: 13, backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 10,
  },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 16,
  },
  userEmail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  logout: {
    borderWidth: 1, borderColor: '#334155', borderRadius: 7,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  logoutText: { color: '#94a3b8', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  addBtn: {
    backgroundColor: '#6366f1', borderRadius: 9, width: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 26, lineHeight: 30 },
  todoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  checkbox: { padding: 2 },
  checkboxInner: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#475569',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  todoText: { flex: 1, fontSize: 16, color: '#e2e8f0' },
  todoDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  del: { color: '#94a3b8', fontSize: 18, paddingHorizontal: 4 },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 30 },
});
