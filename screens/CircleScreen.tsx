// Se'kret Bip — CircleScreen V1
// Four tabs: Public, Friends, Crew, Parent
// Identity rules enforced per tab:
//   Public  → anonymous only, reactions only, no comments, no profile view
//   Friends → nickname/avatar only, comments allowed
//   Crew    → trusted identity visible, comments allowed
//   Parent  → anonymous by default, identity inside parent connections only, comments allowed
// Teen and Parent data are fully separated — no cross-visibility.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import type {
  CircleTab,
  PublicCirclePost,
  FriendsCirclePost,
  CrewCirclePost,
  ParentCirclePost,
  CircleComment,
} from '../types/circle';
import { COMPOSER_DESTINATIONS, CIRCLE_TERMS } from '../types/circle';
import {
  loadCircleFeed,
  syncCircleReaction,
  writeCirclePost,
} from '../utils/sync';

// ─── Reaction sets ──────────────────────────────────────────────────────────
const TEEN_REACTIONS    = ['💜 felt', '🫂 comfort', '💪 proud', '🌙 stay'];
const PARENT_REACTIONS  = ['🫶 beenThere', '🤝 solidarity', '⏰ reminder', '💛 needed', '🌿 strength'];

// ─── Tab config ─────────────────────────────────────────────────────────────
const TABS: { key: CircleTab; label: string; emoji: string }[] = [
  { key: 'public',  label: 'Public',  emoji: '🌎' },
  { key: 'friends', label: 'Friends', emoji: '💜' },
  { key: 'crew',    label: 'Crew',    emoji: '🤝' },
  { key: 'parent',  label: 'Parent',  emoji: '🌿' },
];

// ─── Fallback mock data (shown when Supabase is unconfigured / offline) ──────
const MOCK_PUBLIC: PublicCirclePost[] = [
  { id: 1, text: "some days just feel heavy and i don't know why 🌙", post_mood: 'heavy', media_kind: null, reactions: { felt: 14, comfort: 8, proud: 2, stay: 11 }, created_at: new Date().toISOString() },
  { id: 2, text: 'passed my test today without telling anyone. just wanted to say it somewhere.', post_mood: 'proud', media_kind: null, reactions: { felt: 6, comfort: 3, proud: 22, stay: 5 }, created_at: new Date().toISOString() },
];
const MOCK_FRIENDS: FriendsCirclePost[] = [
  { id: 1, user_id: 'u1', nickname: 'MoonGirl_17', avatar_emoji: '🌙', text: "today felt like a lot but i'm okay", post_mood: 'okay', media_kind: null, reactions: { felt: 4, comfort: 2, proud: 0, stay: 3 }, created_at: new Date().toISOString() },
];
const MOCK_CREW: CrewCirclePost[] = [
  { id: 1, user_id: 'u2', nickname: 'Raylene 💜', avatar_emoji: '💜', text: "crew check-in: what's one thing we're each holding right now?", post_mood: null, media_kind: null, reactions: { felt: 3, comfort: 5, proud: 1, stay: 2 }, created_at: new Date().toISOString() },
];
const MOCK_PARENT: ParentCirclePost[] = [
  { id: 1, user_id: 'p1', text: "does anyone else feel like they don't know how to help without making it worse?", reactions: { beenThere: 9, solidarity: 7, reminder: 2, needed: 5, strength: 4 }, circle_tag: null, created_at: new Date().toISOString(), identity_revealed: false },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReactionBar({
  reactions,
  reactionSet,
  onReact,
}: {
  reactions: Record<string, number>;
  reactionSet: string[];
  onReact: (key: string) => void;
}) {
  return (
    <View style={styles.reactionBar}>
      {reactionSet.map((r) => {
        const [emoji, key] = r.split(' ');
        const count = reactions[key] ?? 0;
        return (
          <TouchableOpacity
            key={key}
            style={styles.reactionBtn}
            onPress={() => onReact(key)}
            accessibilityLabel={`React with ${key}, ${count} reactions`}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PostMenu({
  isOwnPost,
  onBlock,
  onReport,
  onDelete,
}: {
  isOwnPost: boolean;
  onBlock: () => void;
  onReport: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.menuDot} accessibilityLabel="Post options">
        <Text style={styles.menuDotText}>···</Text>
      </TouchableOpacity>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setOpen(false)}>
          <View style={styles.menuSheet}>
            {!isOwnPost && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setOpen(false); onBlock(); }}>
                <Text style={styles.menuItemText}>🚫 Block</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => { setOpen(false); onReport(); }}>
              <Text style={styles.menuItemText}>🚩 Report</Text>
            </TouchableOpacity>
            {isOwnPost && onDelete && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setOpen(false); onDelete(); }}>
                <Text style={[styles.menuItemText, { color: '#e05' }]}>🗑 Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => setOpen(false)}>
              <Text style={[styles.menuItemText, { color: '#888' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── useFeed — shared live-data hook ─────────────────────────────────────────
function useFeed<T>(
  tab: CircleTab,
  fallback: T[],
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [posts, setPosts]   = useState<T[]>(fallback);
  const [loading, setLoading] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    setLoading(true);
    loadCircleFeed(tab).then(rows => {
      if (!active.current) return;
      if (rows && rows.length > 0) setPosts(rows as T[]);
      setLoading(false);
    });
    return () => { active.current = false; };
  }, [tab]);

  return [posts, setPosts, loading];
}

// ─── Public feed ─────────────────────────────────────────────────────────────
function PublicFeed() {
  const [posts, setPosts, loading] = useFeed<PublicCirclePost>('public', MOCK_PUBLIC);

  const handleReact = (postId: number, key: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p
      )
    );
    void syncCircleReaction(postId, 'public', key);
  };

  const handleBlock  = () => Alert.alert('Blocked', 'This account has been blocked.');
  const handleReport = (postId: number) =>
    Alert.alert('Report Bip', 'Why are you reporting this?', [
      { text: 'Harmful content', onPress: () => {} },
      { text: 'Spam',           onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.feedList}
      ListHeaderComponent={
        <View style={styles.anonBadge}>
          <Text style={styles.anonBadgeText}>🌎 Anonymous only · Reactions only · No profiles</Text>
        </View>
      }
      ListEmptyComponent={
        loading
          ? <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
          : <Text style={styles.emptyText}>No bips yet. Be the first. 🌙</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.anonLabel}>Anonymous Bip</Text>
            <PostMenu
              isOwnPost={false}
              onBlock={handleBlock}
              onReport={() => handleReport(item.id)}
            />
          </View>
          <Text style={styles.postText}>{item.text}</Text>
          <ReactionBar
            reactions={item.reactions}
            reactionSet={TEEN_REACTIONS}
            onReact={key => handleReact(item.id, key)}
          />
        </View>
      )}
    />
  );
}

// ─── Friends feed ────────────────────────────────────────────────────────────
function FriendsFeed({ myUserId }: { myUserId: string }) {
  const [posts, setPosts, loading] = useFeed<FriendsCirclePost>('friends', MOCK_FRIENDS);
  const [commentTarget, setCommentTarget] = useState<number | null>(null);
  const [commentText,   setCommentText]   = useState('');
  const [comments, setComments] = useState<Record<number, CircleComment[]>>({});

  const handleReact = (postId: number, key: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p
      )
    );
    void syncCircleReaction(postId, 'friends', key);
  };

  const handleComment = (postId: number) => {
    if (!commentText.trim()) return;
    const newComment: CircleComment = {
      id:           Date.now(),
      post_id:      postId,
      post_type:    'friends',
      user_id:      myUserId,
      nickname:     'You',
      avatar_emoji: '💜',
      text:         commentText.trim(),
      created_at:   new Date().toISOString(),
    };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
    setCommentText('');
    setCommentTarget(null);
  };

  const handleBlock  = () => Alert.alert('Blocked', 'This account has been blocked.');
  const handleReport = (postId: number) =>
    Alert.alert('Report Bip', 'Why are you reporting this?', [
      { text: 'Harmful content', onPress: () => {} },
      { text: 'Spam',           onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.feedList}
      ListHeaderComponent={
        <View style={styles.anonBadge}>
          <Text style={styles.anonBadgeText}>💜 Nickname only · {CIRCLE_TERMS.friends}</Text>
        </View>
      }
      ListEmptyComponent={
        loading
          ? <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
          : <Text style={styles.emptyText}>Your friends circle is quiet. Add people to get started. 💜</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorRow}>
              <Text style={styles.avatarEmoji}>{item.avatar_emoji}</Text>
              <Text style={styles.nickname}>{item.nickname}</Text>
            </View>
            <PostMenu
              isOwnPost={item.user_id === myUserId}
              onBlock={handleBlock}
              onReport={() => handleReport(item.id)}
            />
          </View>
          <Text style={styles.postText}>{item.text}</Text>
          <ReactionBar
            reactions={item.reactions}
            reactionSet={TEEN_REACTIONS}
            onReact={key => handleReact(item.id, key)}
          />
          <View style={styles.commentSection}>
            {(comments[item.id] ?? []).map(c => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentEmoji}>{c.avatar_emoji}</Text>
                <Text style={styles.commentText}><Text style={styles.commentNick}>{c.nickname}</Text> {c.text}</Text>
              </View>
            ))}
            {commentTarget === item.id ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.commentInput}>
                  <TextInput
                    style={styles.commentTextInput}
                    placeholder="Add a reply…"
                    placeholderTextColor="#888"
                    value={commentText}
                    onChangeText={setCommentText}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleComment(item.id)} style={styles.sendBtn}>
                    <Text style={styles.sendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity onPress={() => setCommentTarget(item.id)} style={styles.replyBtn}>
                <Text style={styles.replyBtnText}>+ Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

// ─── Crew feed ───────────────────────────────────────────────────────────────
function CrewFeed({ myUserId }: { myUserId: string }) {
  const [posts, setPosts, loading] = useFeed<CrewCirclePost>('crew', MOCK_CREW);
  const [commentTarget, setCommentTarget] = useState<number | null>(null);
  const [commentText,   setCommentText]   = useState('');
  const [comments, setComments] = useState<Record<number, CircleComment[]>>({});

  const handleReact = (postId: number, key: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p
      )
    );
    void syncCircleReaction(postId, 'crew', key);
  };

  const handleComment = (postId: number) => {
    if (!commentText.trim()) return;
    const newComment: CircleComment = {
      id:           Date.now(),
      post_id:      postId,
      post_type:    'crew',
      user_id:      myUserId,
      nickname:     'You',
      avatar_emoji: '🤝',
      text:         commentText.trim(),
      created_at:   new Date().toISOString(),
    };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
    setCommentText('');
    setCommentTarget(null);
  };

  const handleBlock  = () => Alert.alert('Blocked', 'This account has been blocked.');
  const handleReport = (postId: number) =>
    Alert.alert('Report Bip', 'Why are you reporting this?', [
      { text: 'Harmful content', onPress: () => {} },
      { text: 'Spam',           onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.feedList}
      ListHeaderComponent={
        <View style={styles.anonBadge}>
          <Text style={styles.anonBadgeText}>🤝 Trusted crew only · Identity visible</Text>
        </View>
      }
      ListEmptyComponent={
        loading
          ? <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
          : <Text style={styles.emptyText}>Your crew hasn't posted yet. Start the check-in. 🤝</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorRow}>
              <Text style={styles.avatarEmoji}>{item.avatar_emoji}</Text>
              <Text style={styles.nickname}>{item.nickname}</Text>
            </View>
            <PostMenu
              isOwnPost={item.user_id === myUserId}
              onBlock={handleBlock}
              onReport={() => handleReport(item.id)}
            />
          </View>
          <Text style={styles.postText}>{item.text}</Text>
          <ReactionBar
            reactions={item.reactions}
            reactionSet={TEEN_REACTIONS}
            onReact={key => handleReact(item.id, key)}
          />
          <View style={styles.commentSection}>
            {(comments[item.id] ?? []).map(c => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentEmoji}>{c.avatar_emoji}</Text>
                <Text style={styles.commentText}><Text style={styles.commentNick}>{c.nickname}</Text> {c.text}</Text>
              </View>
            ))}
            {commentTarget === item.id ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.commentInput}>
                  <TextInput
                    style={styles.commentTextInput}
                    placeholder="Add a reply…"
                    placeholderTextColor="#888"
                    value={commentText}
                    onChangeText={setCommentText}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleComment(item.id)} style={styles.sendBtn}>
                    <Text style={styles.sendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity onPress={() => setCommentTarget(item.id)} style={styles.replyBtn}>
                <Text style={styles.replyBtnText}>+ Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

// ─── Parent feed ─────────────────────────────────────────────────────────────
function ParentFeed({ myUserId }: { myUserId: string }) {
  const [posts, setPosts, loading] = useFeed<ParentCirclePost>('parent', MOCK_PARENT);
  const [commentTarget, setCommentTarget] = useState<number | null>(null);
  const [commentText,   setCommentText]   = useState('');
  const [comments, setComments] = useState<Record<number, CircleComment[]>>({});

  const handleReact = (postId: number, key: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } }
          : p
      )
    );
    void syncCircleReaction(postId, 'parent', key);
  };

  const handleComment = (postId: number) => {
    if (!commentText.trim()) return;
    const newComment: CircleComment = {
      id:           Date.now(),
      post_id:      postId,
      post_type:    'parent',
      user_id:      myUserId,
      nickname:     'Anonymous Parent',
      avatar_emoji: '🌿',
      text:         commentText.trim(),
      created_at:   new Date().toISOString(),
    };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
    setCommentText('');
    setCommentTarget(null);
  };

  const handleBlock  = () => Alert.alert('Blocked', 'This account has been blocked.');
  const handleReport = (postId: number) =>
    Alert.alert('Report Bip', 'Why are you reporting this?', [
      { text: 'Harmful content', onPress: () => {} },
      { text: 'Spam',           onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.feedList}
      ListHeaderComponent={
        <View style={styles.anonBadge}>
          <Text style={styles.anonBadgeText}>🌿 Parent connections only · Anonymous by default</Text>
        </View>
      }
      ListEmptyComponent={
        loading
          ? <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
          : <Text style={styles.emptyText}>No parent bips yet. This is a safe space. 🌿</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.authorRow}>
              <Text style={styles.avatarEmoji}>
                {item.identity_revealed ? (item.avatar_emoji ?? '🌿') : '🌿'}
              </Text>
              <Text style={styles.nickname}>
                {item.identity_revealed ? (item.nickname ?? 'Anonymous Parent') : 'Anonymous Parent'}
              </Text>
            </View>
            <PostMenu
              isOwnPost={item.user_id === myUserId}
              onBlock={handleBlock}
              onReport={() => handleReport(item.id)}
            />
          </View>
          <Text style={styles.postText}>{item.text}</Text>
          <ReactionBar
            reactions={item.reactions}
            reactionSet={PARENT_REACTIONS}
            onReact={key => handleReact(item.id, key)}
          />
          <View style={styles.commentSection}>
            {(comments[item.id] ?? []).map(c => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentEmoji}>{c.avatar_emoji}</Text>
                <Text style={styles.commentText}><Text style={styles.commentNick}>{c.nickname}</Text> {c.text}</Text>
              </View>
            ))}
            {commentTarget === item.id ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.commentInput}>
                  <TextInput
                    style={styles.commentTextInput}
                    placeholder="Reply anonymously…"
                    placeholderTextColor="#888"
                    value={commentText}
                    onChangeText={setCommentText}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleComment(item.id)} style={styles.sendBtn}>
                    <Text style={styles.sendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <TouchableOpacity onPress={() => setCommentTarget(item.id)} style={styles.replyBtn}>
                <Text style={styles.replyBtnText}>+ Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────
function Composer({
  activeTab,
  nickname,
  onClose,
  onPost,
}: {
  activeTab: CircleTab;
  nickname: string;
  onClose: () => void;
  onPost: (tab: CircleTab, text: string) => void;
}) {
  const [selectedDest, setSelectedDest] = useState<CircleTab>(activeTab);
  const [text, setText] = useState('');

  const dest = COMPOSER_DESTINATIONS.find(d => d.tab === selectedDest)!;
  const resolvedIdentity = dest.anonymousOnly
    ? 'Anonymous'
    : nickname || 'Set your nickname in Settings';

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(selectedDest, text.trim());
    setText('');
    onClose();
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.composerWrap}>
        <View style={styles.composerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.composerClose}>
            <Text style={styles.composerCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.composerTitle}>Where does this Bip go?</Text>
          <TouchableOpacity onPress={handlePost} style={styles.composerPostBtn}>
            <Text style={styles.composerPostText}>Bip it</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destScroll} contentContainerStyle={styles.destRow}>
          {COMPOSER_DESTINATIONS.map(d => (
            <TouchableOpacity
              key={d.tab}
              style={[styles.destChip, selectedDest === d.tab && styles.destChipActive]}
              onPress={() => setSelectedDest(d.tab)}
            >
              <Text style={[styles.destChipText, selectedDest === d.tab && styles.destChipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.identityRow}>
          <Text style={styles.identityLabel}>{dest.identityLabel}</Text>
          <Text style={styles.identityValue}>{resolvedIdentity}</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TextInput
            style={styles.composerInput}
            placeholder={`What's your Bip for ${dest.label}?`}
            placeholderTextColor="#888"
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
          />
        </KeyboardAvoidingView>

        {!dest.allowComments && (
          <View style={styles.noCommentNote}>
            <Text style={styles.noCommentNoteText}>🔒 Public Bips get reactions only — no comments, no identity.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Add To My Circle modal ──────────────────────────────────────────────────
function AddToCircleModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const handleSend = () => {
    if (!code.trim()) return;
    Alert.alert(`${CIRCLE_TERMS.friendRequest} Sent`, `Your request has been sent!`);
    onClose();
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.addCircleSheet}>
          <Text style={styles.addCircleTitle}>💜 {CIRCLE_TERMS.friendRequest}</Text>
          <Text style={styles.addCircleSubtitle}>Enter their Bip code to add them to {CIRCLE_TERMS.friends}.</Text>
          <TextInput
            style={styles.addCircleInput}
            placeholder="Enter Bip code…"
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addCircleBtn} onPress={handleSend}>
            <Text style={styles.addCircleBtnText}>Send {CIRCLE_TERMS.friendRequest}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ color: '#888', textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CircleScreen(_props: Record<string, unknown> = {}) {
  const myUserId   = 'current-user-id';
  const myNickname = 'MoonGirl_17';

  const [activeTab,     setActiveTab]     = useState<CircleTab>('public');
  const [composerOpen,  setComposerOpen]  = useState(false);
  const [addCircleOpen, setAddCircleOpen] = useState(false);

  const handlePost = useCallback((tab: CircleTab, text: string) => {
    void writeCirclePost(tab, text);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Circle</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setAddCircleOpen(true)} style={styles.headerBtn} accessibilityLabel={CIRCLE_TERMS.friendRequest}>
            <Text style={styles.headerBtnText}>+ {CIRCLE_TERMS.friendRequest}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setComposerOpen(true)} style={styles.headerBtnPrimary} accessibilityLabel="New Bip">
            <Text style={styles.headerBtnPrimaryText}>+ Bip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.emoji} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.feedWrap}>
        {activeTab === 'public'  && <PublicFeed />}
        {activeTab === 'friends' && <FriendsFeed myUserId={myUserId} />}
        {activeTab === 'crew'    && <CrewFeed    myUserId={myUserId} />}
        {activeTab === 'parent'  && <ParentFeed  myUserId={myUserId} />}
      </View>

      {composerOpen && (
        <Composer
          activeTab={activeTab}
          nickname={myNickname}
          onClose={() => setComposerOpen(false)}
          onPost={handlePost}
        />
      )}

      {addCircleOpen && <AddToCircleModal onClose={() => setAddCircleOpen(false)} />}
    </SafeAreaView>
  );
}

// Named re-export so both `import CircleScreen from '...'` and
// `import { CircleScreen } from '...'` work throughout the codebase.
export { CircleScreen };

// ─── Styles ───────────────────────────────────────────────────────────────────
const PURPLE = '#7C4DFF';
const DARK   = '#1a1a2e';
const CARD   = '#16213e';
const TEXT   = '#e0e0e0';
const MUTED  = '#888';

const styles = StyleSheet.create({
  root:                { flex: 1, backgroundColor: DARK },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle:         { color: TEXT, fontSize: 20, fontWeight: '700' },
  headerActions:       { flexDirection: 'row', gap: 8 },
  headerBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: PURPLE },
  headerBtnText:       { color: PURPLE, fontSize: 13, fontWeight: '600' },
  headerBtnPrimary:    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: PURPLE },
  headerBtnPrimaryText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  tabBar:              { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' },
  tab:                 { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:           { borderBottomWidth: 2, borderBottomColor: PURPLE },
  tabText:             { color: MUTED, fontSize: 13, fontWeight: '500' },
  tabTextActive:       { color: PURPLE, fontWeight: '700' },
  feedWrap:            { flex: 1 },
  feedList:            { padding: 16, gap: 12 },
  anonBadge:           { backgroundColor: '#1e1e3a', borderRadius: 8, padding: 8, marginBottom: 8 },
  anonBadgeText:       { color: MUTED, fontSize: 12, textAlign: 'center' },
  postCard:            { backgroundColor: CARD, borderRadius: 12, padding: 14, marginBottom: 4 },
  postHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  authorRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarEmoji:         { fontSize: 18 },
  nickname:            { color: TEXT, fontSize: 14, fontWeight: '600' },
  anonLabel:           { color: MUTED, fontSize: 13, fontStyle: 'italic' },
  postText:            { color: TEXT, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  emptyText:           { color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 48, paddingHorizontal: 32, lineHeight: 22 },
  reactionBar:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  reactionBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e3a', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  reactionEmoji:       { fontSize: 15 },
  reactionCount:       { color: TEXT, fontSize: 12, fontWeight: '600' },
  commentSection:      { marginTop: 8, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 8 },
  commentRow:          { flexDirection: 'row', gap: 6, marginBottom: 6 },
  commentEmoji:        { fontSize: 14 },
  commentText:         { color: MUTED, fontSize: 13, flex: 1, lineHeight: 18 },
  commentNick:         { color: TEXT, fontWeight: '600' },
  commentInput:        { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  commentTextInput:    { flex: 1, backgroundColor: '#0f0f1a', color: TEXT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  sendBtn:             { backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  sendBtnText:         { color: '#fff', fontWeight: '700', fontSize: 13 },
  replyBtn:            { paddingVertical: 4 },
  replyBtnText:        { color: PURPLE, fontSize: 13 },
  menuDot:             { padding: 6 },
  menuDotText:         { color: MUTED, fontSize: 18, letterSpacing: 1 },
  menuOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  menuSheet:           { backgroundColor: CARD, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  menuItem:            { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  menuItemText:        { color: TEXT, fontSize: 16 },
  composerWrap:        { flex: 1, backgroundColor: DARK },
  composerHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  composerTitle:       { color: TEXT, fontSize: 16, fontWeight: '700' },
  composerClose:       { padding: 4 },
  composerCloseText:   { color: MUTED, fontSize: 18 },
  composerPostBtn:     { backgroundColor: PURPLE, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7 },
  composerPostText:    { color: '#fff', fontWeight: '700' },
  destScroll:          { maxHeight: 52, flexGrow: 0 },
  destRow:             { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  destChip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  destChipActive:      { backgroundColor: PURPLE, borderColor: PURPLE },
  destChipText:        { color: MUTED, fontSize: 13 },
  destChipTextActive:  { color: '#fff', fontWeight: '700' },
  identityRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e1e3a' },
  identityLabel:       { color: MUTED, fontSize: 13 },
  identityValue:       { color: TEXT, fontSize: 13, fontWeight: '600' },
  composerInput:       { flex: 1, color: TEXT, fontSize: 16, padding: 16, textAlignVertical: 'top' },
  noCommentNote:       { padding: 12, borderTopWidth: 1, borderTopColor: '#222' },
  noCommentNoteText:   { color: MUTED, fontSize: 12, textAlign: 'center' },
  addCircleSheet:      { backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  addCircleTitle:      { color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  addCircleSubtitle:   { color: MUTED, fontSize: 14, marginBottom: 16, lineHeight: 20 },
  addCircleInput:      { backgroundColor: '#0f0f1a', color: TEXT, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 12 },
  addCircleBtn:        { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addCircleBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});
