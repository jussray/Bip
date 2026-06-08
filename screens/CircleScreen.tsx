import React, { useRef, useEffect, useState, useMemo } from 'react';
import { IMAGES, getRoomBg, TimeOfDay } from '../constants/theme';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Animated,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const CLOUD_HAPPY = require('../assets/images/cloud-happy.png');
const CLOUD_STORMY = require('../assets/images/cloud-stormy.png');

type MediaType = 'text' | 'photo' | 'fitCheck' | 'art' | 'room' | 'clip' | 'growth';
type SafetyLevel = 'none' | 'soft' | 'bridge' | 'parent';
type SelectedMediaType = 'image' | 'video';

type ScanResult = {
  level: SafetyLevel;
  reason?: string;
  suggestion?: string;
};

type CirclePost = {
  id: string;
  text: string;
  date?: string;
  time?: string;
  bipType?: string;
  mediaUri?: string;
  mediaType?: SelectedMediaType;
  mediaKind?: MediaType;
  reactions?: {
    felt?: number;
    comfort?: number;
    proud?: number;
    stay?: number;
  };
  quietRepliesCount?: number;
};

type CircleScreenProps = {
  t: Record<string, any>;
  circlePosts: CirclePost[];
  circlePostText: string;
  setCirclePostText: (text: string) => void;
  saveCirclePost: (extra?: Partial<CirclePost>) => void;
  reactToPost: (id: string, type: string) => void;
  setScreen: (screen: string) => void;
  BottomNav: React.ReactNode;
  sendQuietReply?: (postId: string, replyText: string) => void;
  selectedSekret?: 'raylene' | 'rylane' | string;
  mood?: string;
};

const MEDIA_TYPES: { id: MediaType; emoji: string; label: string; sub: string }[] = [
  { id: 'text', emoji: '📖', label: 'Thought Bip', sub: 'say it how it feels' },
  { id: 'photo', emoji: '🖼️', label: 'Photo Bip', sub: 'share a moment' },
  { id: 'fitCheck', emoji: '✨', label: 'Fit Check', sub: 'confidence, not ratings' },
  { id: 'art', emoji: '🎨', label: 'Art Bip', sub: 'made something real' },
  { id: 'room', emoji: '🛏️', label: 'Room Glow', sub: 'your space, your vibe' },
  { id: 'clip', emoji: '🎬', label: 'Short Clip', sub: '5–15 seconds of life' },
  { id: 'growth', emoji: '⭐', label: 'Growth Bip', sub: 'a win, a step, a shift' },
];

const FIT_CHECK_REACTIONS = [
  { emoji: '💜', label: 'Clean Fit' },
  { emoji: '☁️', label: 'Love The Energy' },
  { emoji: '⭐', label: 'That’s You' },
  { emoji: '🔥', label: 'Color Combo Goes Crazy' },
  { emoji: '🎨', label: 'Creative Choice' },
];

const QUOTE_REPLIES_RAYLENE = [
  'I felt this too.',
  'You are not alone in this.',
  'That sounds heavy 💜',
  'I’m glad you said it.',
  'Staying with you.',
  'No fixing, just here.',
  'Proud of you for saying it.',
  'This made sense to me.',
];

const QUOTE_REPLIES_RYLANE = [
  'felt that. fr.',
  'you’re not alone bro.',
  'heavy day. respect for posting.',
  'glad you said it out loud.',
  'right here. not going anywhere.',
  'no advice. just with you.',
  'that took guts.',
  'this hit. for real.',
];

const LIGHT_WORDS = ['tired', 'overwhelmed', 'stressed', 'ugh', 'annoyed', 'frustrated', 'embarrassed'];
const MEDIUM_WORDS = ['alone', 'sad', 'hurt', 'crying', 'scared', 'anxious', 'panic', 'bullied', 'ignored'];
const HEAVY_WORDS = [
  'done',
  'empty',
  'worthless',
  'nobody',
  'disappear',
  'cant anymore',
  "can't anymore",
  'kill myself',
  'self harm',
  'hurt myself',
  'weapon',
  'gun',
];

const PII_WORDS = [
  'address',
  'school',
  'phone number',
  'license plate',
  'id card',
  'student id',
  'snapcode',
  'email',
];

const getSafetyLevel = (text: string): ScanResult => {
  const lower = text.toLowerCase();

  if (HEAVY_WORDS.some(w => lower.includes(w))) {
    return {
      level: 'parent',
      reason: 'This one looks serious.',
      suggestion: 'Let’s pull in a trusted grown-up through Bridge.',
    };
  }

  if (PII_WORDS.some(w => lower.includes(w))) {
    return {
      level: 'bridge',
      reason: 'This may include personal info.',
      suggestion: 'Try cropping or blurring before you post.',
    };
  }

  if (MEDIUM_WORDS.some(w => lower.includes(w))) {
    return {
      level: 'bridge',
      reason: 'This feels heavy.',
      suggestion: 'You can share a softer version through Bridge.',
    };
  }

  if (LIGHT_WORDS.some(w => lower.includes(w))) {
    return {
      level: 'soft',
      reason: 'This feels like a rough moment.',
      suggestion: 'Circle can hold this gently.',
    };
  }

  return { level: 'none' };
};

const getTimeOfDay = (): TimeOfDay => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
};

const moodGlow = (mood?: string): string => {
  const m = (mood || '').toLowerCase();
  if (m === 'happy') return '#fbbf24';
  if (m === 'sad' || m === 'anxious') return '#7dd3fc';
  if (m === 'angry' || m === 'overwhelmed' || m === 'stressed') return '#f472b6';
  if (m === 'tired') return '#6d28d9';
  if (m === 'calm') return '#c4b5fd';
  return '#c4b5fd';
};

export function CircleScreen({
  t,
  circlePosts,
  circlePostText,
  setCirclePostText,
  saveCirclePost,
  reactToPost,
  setScreen,
  BottomNav,
  sendQuietReply,
  selectedSekret,
  mood,
}: CircleScreenProps) {
  const isRylane = selectedSekret === 'rylane';
  const charLabel = isRylane ? 'rylane' : 'raylene';
  const charKey: 'raylene' | 'rylane' = isRylane ? 'rylane' : 'raylene';
  const time = useMemo(() => getTimeOfDay(), []);
  const bg = useMemo(() => getRoomBg(charKey, time), [charKey, time]);
  const glow = useMemo(() => moodGlow(mood), [mood]);

  const QUOTE_REPLIES = isRylane ? QUOTE_REPLIES_RYLANE : QUOTE_REPLIES_RAYLENE;

  const [selectedType, setSelectedType] = useState<MediaType>('text');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showFitCheckMode, setShowFitCheckMode] = useState(false);
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<SelectedMediaType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSoftCheckIn, setShowSoftCheckIn] = useState(false);
  const [showBridgeSuggestion, setShowBridgeSuggestion] = useState(false);
  const [showParentPrompt, setShowParentPrompt] = useState(false);
  const [activeReplySheetPostId, setActiveReplySheetPostId] = useState<string | null>(null);
  const [activeMediaPreviewOpen, setActiveMediaPreviewOpen] = useState(false);
  const [selectedQuietReply, setSelectedQuietReply] = useState<string>('');
  const [fitCheckReactionIndex, setFitCheckReactionIndex] = useState<number>(0);

  const currentType = useMemo(
    () => MEDIA_TYPES.find(item => item.id === selectedType) || MEDIA_TYPES[0],
    [selectedType],
  );

  // Entrance animations — staggered card fade-ins
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;
  const fade4 = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = (val: Animated.Value, delay: number) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    Animated.parallel([
      stagger(fade1, 0),
      stagger(fade2, 140),
      stagger(fade3, 280),
      stagger(fade4, 420),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [fade1, fade2, fade3, fade4, breath]);

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  const cardStyle = (val: Animated.Value) => ({
    opacity: val,
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  });

  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(style);
    } catch {
      void 0;
    }
  };

  const runSafetyScan = (text: string, hasMedia: boolean): ScanResult => {
    const base = getSafetyLevel(text);
    if (hasMedia && base.level === 'none') return base;
    return base;
  };

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.85,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const type = asset.type === 'video' ? 'video' : 'image';

      setSelectedMediaUri(uri);
      setSelectedMediaType(type);
      setShowMediaPicker(false);
      setActiveMediaPreviewOpen(true);

      const scan = runSafetyScan(circlePostText, true);
      setScanResult(scan);

      if (scan.level === 'soft') {
        setShowSoftCheckIn(true);
        setShowBridgeSuggestion(false);
        setShowParentPrompt(false);
      } else if (scan.level === 'bridge') {
        setShowBridgeSuggestion(true);
        setShowSoftCheckIn(false);
        setShowParentPrompt(false);
      } else if (scan.level === 'parent') {
        setShowParentPrompt(true);
        setShowSoftCheckIn(false);
        setShowBridgeSuggestion(false);
      }

      await triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setShowMediaPicker(false);
    }
  };

  const handleTypeChange = async (type: MediaType) => {
    setSelectedType(type);
    setShowTypeMenu(false);
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    if (type === 'fitCheck') {
      setShowFitCheckMode(true);
    } else {
      setShowFitCheckMode(false);
    }
  };

  const handleSavePost = async () => {
    setIsSubmitting(true);
    const scan = runSafetyScan(circlePostText, !!selectedMediaUri);
    setScanResult(scan);

    if (scan.level === 'parent') {
      setShowParentPrompt(true);
      setShowBridgeSuggestion(false);
      setShowSoftCheckIn(false);
      setIsSubmitting(false);
      await triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    if (scan.level === 'bridge') {
      setShowBridgeSuggestion(true);
      setShowSoftCheckIn(false);
      setShowParentPrompt(false);
      setIsSubmitting(false);
      await triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    if (scan.level === 'soft') {
      setShowSoftCheckIn(true);
      setShowBridgeSuggestion(false);
      setShowParentPrompt(false);
    }

    saveCirclePost({
      text: circlePostText,
      mediaUri: selectedMediaUri || undefined,
      mediaType: selectedMediaType || undefined,
      mediaKind: selectedType,
    });

    setCirclePostText('');
    setSelectedMediaUri(null);
    setSelectedMediaType(null);
    setActiveMediaPreviewOpen(false);
    setIsSubmitting(false);
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleBridgeShare = async () => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setScreen('bridge');
  };

  const handleParentPrompt = async () => {
    await triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setScreen('parentBridge');
  };

  // Char-aware copy
  const headerTagline = isRylane
    ? 'no likes. no count. no clout. just us.'
    : 'no likes. no followers. just real, soft, here.';
  const energyText = isRylane ? '⚡ low-stakes space open' : '💜 soft space open';
  const cultureLines = isRylane
    ? ['no bullying. no exposing. no chasing clout.', 'just real bips. real circle. respect.']
    : ['no bullying. no exposing. no going viral.', 'just real bips, real connection, real safety.'];
  const composerHint = isRylane ? 'say it plain. no filter.' : 'say it how it feels, gently.';

  return (
    <ImageBackground source={bg} style={styles.bgImage} resizeMode="cover">
      <LinearGradient
        colors={['rgba(20,10,40,0.55)', 'rgba(40,20,70,0.72)', 'rgba(15,8,30,0.88)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: glow + '10' }]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={cardStyle(fade1)}>
          <Text style={styles.logo}>Bip Circle 🌐</Text>
          <Text style={styles.subtitle}>{headerTagline}</Text>

          <Animated.View
            style={[
              styles.energyBadge,
              { borderColor: glow, shadowColor: glow, shadowOpacity: 0.6, shadowRadius: 12 },
              { transform: [{ scale: breathScale }], opacity: breathOpacity },
            ]}
          >
            <Text style={[styles.energyText, { color: glow }]}>{energyText}</Text>
          </Animated.View>

          <View style={styles.cloudWrap}>
            <Animated.Image
              source={CLOUD_HAPPY}
              style={[styles.artworkSmall, { transform: [{ scale: breathScale }], opacity: breathOpacity }]}
              resizeMode="contain"
            />
            <View style={[styles.presencePill, { borderColor: glow }]}>
              <Text style={[styles.presenceText, { color: '#f5f0ff' }]}>
                {charLabel} is here · circle is soft
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={cardStyle(fade2)}>
          <View style={[styles.card, { backgroundColor: 'rgba(30,18,55,0.78)', borderColor: glow, shadowColor: glow }]}>
            <Text style={styles.cardEmoji}>✨</Text>
            <Text style={styles.cardText}>circle is for real moments.</Text>
            <Text style={styles.entryText}>
              drop anonymous bips, photos, fit checks, art, room glow, short clips, growth wins. no count. no clout.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.typeSelector, { borderColor: glow, backgroundColor: 'rgba(20,12,40,0.7)' }]}
            onPress={() => setShowTypeMenu(s => !s)}
          >
            <Text style={styles.typeSelectorText}>
              {currentType.emoji} {currentType.label}
            </Text>
            <Text style={[styles.typeSelectorSub, { color: '#cbb6f7' }]}>
              {currentType.sub} {showTypeMenu ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showTypeMenu && (
            <View style={[styles.typeMenu, { backgroundColor: 'rgba(20,12,40,0.92)', borderColor: glow }]}>
              {MEDIA_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    selectedType === type.id && { backgroundColor: 'rgba(168,85,247,0.18)' },
                  ]}
                  onPress={() => handleTypeChange(type.id)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeSub}>{type.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedType !== 'text' && (
            <TouchableOpacity
              style={[styles.mediaPickerBtn, { backgroundColor: glow }]}
              onPress={handlePickMedia}
            >
              <Text style={styles.mediaPickerText}>pick media</Text>
            </TouchableOpacity>
          )}

          {selectedMediaUri && (
            <View style={[styles.previewCard, { backgroundColor: 'rgba(20,12,40,0.7)', borderColor: glow }]}>
              <Text style={styles.previewLabel}>preview</Text>
              <Text style={styles.previewPath}>{selectedMediaType === 'video' ? '🎬 video selected' : '🖼️ photo selected'}</Text>
              <Text style={styles.previewPath} numberOfLines={1}>{selectedMediaUri}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={cardStyle(fade3)}>
          <View style={[styles.composerCard, { backgroundColor: 'rgba(30,18,55,0.82)', borderColor: glow, shadowColor: glow }]}>
            <Text style={[styles.composerPrompt, { color: '#cbb6f7' }]}>
              {currentType.emoji} drop a {currentType.label}…
            </Text>
            <TextInput
              style={[styles.input, { borderColor: glow + '66' }]}
              placeholder={composerHint}
              placeholderTextColor="#7c6b98"
              multiline
              value={circlePostText}
              onChangeText={text => {
                setCirclePostText(text);
                const scan = runSafetyScan(text, !!selectedMediaUri);
                setScanResult(scan);
                setShowSoftCheckIn(scan.level === 'soft');
                setShowBridgeSuggestion(scan.level === 'bridge');
                setShowParentPrompt(scan.level === 'parent');
              }}
            />

            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: glow }]}
              onPress={handleSavePost}
              disabled={isSubmitting}
            >
              <Text style={styles.postBtnText}>
                {isSubmitting ? 'posting…' : '+ post anonymous bip'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.safeText}>
              anonymous · protected · real. no bullying. no exposing people.
            </Text>
          </View>

          <View style={styles.stickyNote}>
            <Text style={styles.stickyText}>
              {isRylane
                ? '“no count. no clout. just keep it real.”'
                : '“it’s safe here. say it gentle, say it true.”'}
            </Text>
          </View>

          {showSoftCheckIn && (
            <View style={[styles.softCard, { borderColor: glow }]}>
              <Text style={styles.softTitle}>hold up 💜</Text>
              <Text style={styles.softText}>
                {isRylane
                  ? 'this one feels rough. circle’s got you.'
                  : 'this one feels a little tender. circle can hold it gently.'}
              </Text>
            </View>
          )}

          {showBridgeSuggestion && (
            <View style={[styles.bridgeCard, { borderColor: glow }]}>
              <Text style={styles.bridgeTitle}>this might land easier through bridge.</Text>
              <Text style={styles.bridgeText}>
                share a softer version with someone you trust. you stay in control of what they see.
              </Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: glow + '40' }]} onPress={handleBridgeShare}>
                <Text style={styles.smallBtnText}>open bridge</Text>
              </TouchableOpacity>
            </View>
          )}

          {showParentPrompt && (
            <View style={[styles.parentCard, { borderColor: glow }]}>
              <Text style={styles.parentTitle}>we wanna keep you safe.</Text>
              <Text style={styles.parentText}>
                this one might need a trusted grown-up. you choose what gets shared.
              </Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: glow + '40' }]} onPress={handleParentPrompt}>
                <Text style={styles.smallBtnText}>open parent window</Text>
              </TouchableOpacity>
            </View>
          )}

          {showFitCheckMode && (
            <View style={[styles.fitCard, { borderColor: glow, backgroundColor: 'rgba(30,18,55,0.78)' }]}>
              <Text style={styles.fitTitle}>✨ fit check</Text>
              <Text style={styles.fitText}>
                expression · creativity · confidence. not ratings. not popularity.
              </Text>
              <View style={styles.fitReactions}>
                {FIT_CHECK_REACTIONS.map((reaction) => (
                  <View key={reaction.label} style={[styles.fitReaction, { borderColor: glow }]}>
                    <Text style={styles.fitReactionEmoji}>{reaction.emoji}</Text>
                    <Text style={styles.fitReactionLabel}>{reaction.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.fitVoice}>
                {isRylane
                  ? 'okay the drip is the drip. confidence > anything.'
                  : 'okayyyy fit check 👀 the confidence is the best part.'}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={cardStyle(fade4)}>
          <View style={[styles.sectionCard, { borderColor: glow, backgroundColor: 'rgba(20,12,40,0.7)' }]}>
            <Text style={styles.sectionTitle}>circle bips</Text>
            {circlePosts.length === 0 && (
              <Text style={styles.emptyText}>
                {isRylane ? 'circle’s quiet. drop something real.' : 'circle is quiet right now. you can be the first.'}
              </Text>
            )}
            {circlePosts.map(post => (
              <View key={post.id} style={[styles.postCard, { borderColor: glow + '88' }]}>
                <Text style={styles.postText}>{post.text}</Text>
                {!!post.mediaUri && <Text style={styles.postMedia}>media attached</Text>}
                <View style={styles.reactionRow}>
                  {[
                    ['💜', 'felt', 'felt this'],
                    ['☁️', 'comfort', 'comfort'],
                    ['⭐', 'proud', 'proud'],
                    ['🌙', 'stay', 'stayed'],
                  ].map(([emoji, type, label]) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => reactToPost(post.id, type as string)}
                      style={styles.reactionBtn}
                    >
                      <Text style={styles.reactionText}>{emoji} {(post.reactions as any)?.[type as string] || 0}</Text>
                      <Text style={styles.reactionLabel}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.replyBtn, { backgroundColor: glow + '24' }]}
                  onPress={() => setActiveReplySheetPostId(post.id)}
                >
                  <Text style={styles.replyBtnText}>
                    reply softly{post.quietRepliesCount ? ` · ${post.quietRepliesCount} quiet replies sent` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.cultureCard, { borderColor: glow, backgroundColor: 'rgba(30,18,55,0.78)' }]}>
            <Text style={styles.cultureTitle}>circle culture 💜</Text>
            {cultureLines.map((line, i) => (
              <Text key={i} style={styles.cultureText}>{line}</Text>
            ))}
          </View>
        </Animated.View>

        <Modal
          visible={!!activeReplySheetPostId}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveReplySheetPostId(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: 'rgba(20,12,40,0.96)', borderColor: glow }]}>
              <Text style={styles.modalTitle}>reply softly</Text>
              <Text style={styles.modalSub}>pick one. anonymous. no thread. no drama.</Text>
              {QUOTE_REPLIES.map(reply => (
                <TouchableOpacity
                  key={reply}
                  style={[styles.replyOption, selectedQuietReply === reply && { backgroundColor: glow + '30' }]}
                  onPress={() => setSelectedQuietReply(reply)}
                >
                  <Text style={styles.replyOptionText}>{reply}</Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={[styles.replyInput, { borderColor: glow + '66' }]}
                placeholder={isRylane ? 'or one short note. keep it real.' : 'or one short custom note…'}
                placeholderTextColor="#7c6b98"
                value={selectedQuietReply}
                onChangeText={setSelectedQuietReply}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: glow }]}
                onPress={() => {
                  if (activeReplySheetPostId && selectedQuietReply.trim()) {
                    sendQuietReply?.(activeReplySheetPostId, selectedQuietReply.trim());
                  }
                  setSelectedQuietReply('');
                  setActiveReplySheetPostId(null);
                }}
              >
                <Text style={styles.sendBtnText}>send quietly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setSelectedQuietReply('');
                  setActiveReplySheetPostId(null);
                }}
              >
                <Text style={styles.cancelBtnText}>nevermind</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {BottomNav}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: '#cbb6f7', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  energyBadge: { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  energyText: { fontSize: 13, fontWeight: '600' },

  cloudWrap: { alignItems: 'center', marginBottom: 14 },
  artworkSmall: { width: 84, height: 84, marginBottom: 6 },
  presencePill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(20,12,40,0.6)' },
  presenceText: { fontSize: 12, fontWeight: '600' },

  card: { padding: 18, borderRadius: 20, marginBottom: 14, borderWidth: 1, shadowOpacity: 0.35, shadowRadius: 14 },
  cardEmoji: { fontSize: 30, marginBottom: 6 },
  cardText: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  entryText: { color: '#e9defc', fontSize: 14, lineHeight: 21 },

  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  typeSelectorText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  typeSelectorSub: { fontSize: 12 },
  typeMenu: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  typeEmoji: { fontSize: 22 },
  typeLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  typeSub: { color: '#94A3B8', fontSize: 12 },

  mediaPickerBtn: { padding: 14, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  mediaPickerText: { color: '#fff', fontWeight: '700' },
  previewCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  previewLabel: { color: '#fff', fontWeight: '700', marginBottom: 4 },
  previewPath: { color: '#cbb6f7', fontSize: 12 },

  composerCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, shadowOpacity: 0.4, shadowRadius: 14 },
  composerPrompt: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  input: { color: '#fff', padding: 14, borderRadius: 14, minHeight: 110, textAlignVertical: 'top', marginBottom: 14, backgroundColor: 'rgba(0,0,0,0.35)', fontSize: 14, lineHeight: 22, borderWidth: 1 },
  postBtn: { padding: 16, borderRadius: 18, marginBottom: 8, alignItems: 'center' },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  safeText: { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 4 },

  stickyNote: { backgroundColor: '#fff8e7', borderColor: '#7c3aed', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 10, marginBottom: 12, transform: [{ rotate: '-2deg' }] },
  stickyText: { color: '#3a2461', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },

  softCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: 'rgba(124,58,237,0.16)' },
  softTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  softText: { color: '#e9defc', fontSize: 13, lineHeight: 19 },

  bridgeCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: 'rgba(124,58,237,0.16)' },
  bridgeTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  bridgeText: { color: '#e9defc', fontSize: 13, lineHeight: 19, marginBottom: 10 },

  parentCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: 'rgba(124,58,237,0.16)' },
  parentTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  parentText: { color: '#e9defc', fontSize: 13, lineHeight: 19, marginBottom: 10 },

  smallBtn: { padding: 10, borderRadius: 12, alignItems: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  fitCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  fitTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  fitText: { color: '#cbb6f7', fontSize: 13, marginBottom: 12, lineHeight: 19 },
  fitReactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  fitReaction: { borderWidth: 1, borderRadius: 14, padding: 10, minWidth: '31%', alignItems: 'center' },
  fitReactionEmoji: { fontSize: 18, marginBottom: 4 },
  fitReactionLabel: { color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  fitVoice: { color: '#f5f0ff', fontSize: 13, fontStyle: 'italic' },

  sectionCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 6, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { color: '#cbb6f7', fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 18 },

  postCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, backgroundColor: 'rgba(20,12,40,0.4)' },
  postText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  postMedia: { color: '#cbb6f7', fontSize: 12, marginBottom: 10 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  reactionBtn: { backgroundColor: 'rgba(30,18,55,0.85)', padding: 10, borderRadius: 14, alignItems: 'center', minWidth: '22%' },
  reactionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  reactionLabel: { color: '#cbb6f7', fontSize: 10, marginTop: 2 },

  replyBtn: { marginTop: 10, padding: 12, borderRadius: 14 },
  replyBtnText: { color: '#f5f0ff', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  cultureCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 4, marginBottom: 24 },
  cultureTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cultureText: { color: '#e9defc', fontSize: 13, marginBottom: 4, lineHeight: 19 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: '#cbb6f7', fontSize: 12, marginBottom: 12 },
  replyOption: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  replyOptionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  replyInput: { color: '#fff', padding: 12, borderRadius: 12, minHeight: 44, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1 },
  sendBtn: { marginTop: 12, padding: 14, borderRadius: 16, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '800' },
  cancelBtn: { marginTop: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#cbb6f7', fontSize: 13 },
});
