import { useRef } from 'react';
import { Animated } from 'react-native';
import { SEKRET_PROFILES, COMFORT_MESSAGES, HOME_MESSAGES } from '@constants/theme';
const [screen, setScreen]               = useState('home');
const [journalText, setJournalText]     = useState('');
const [voiceNotes, setVoiceNotes]       = useState<any[]>([]);
const [circlePostText, setCirclePostText] = useState('');
const [sekretMessage, setSekretMessage] = useState('');
const [sekretReply, setSekretReply]     = useState("I see you. You did your best with what you had today.");
const [isSekretTyping, setIsSekretTyping] = useState(false);
const [comfortIdx, setComfortIdx]       = useState(0);
const [homeMessageIndex, setHomeMessageIndex] = useState(0);
const [isRecording, setIsRecording]     = useState(false);
const [bridgeText, setBridgeText]       = useState('');
const [selectedTone, setSelectedTone]   = useState('softStart');

const breatheAnim = useRef(new Animated.Value(1)).current;
const pulseAnim   = useRef(new Animated.Value(1)).current;
const pulseLoop   = useRef<any>(null);

const currentSekret = SEKRET_PROFILES[selectedSekret];
const voiceKey      = selectedSekret === 'rylane' ? 'rylane' : 'raylene';
const charName      = selectedSekret === 'rylane' ? 'Rylane' : 'Raylene';
// Breathe animation
useEffect(() => {
  Animated.loop(Animated.sequence([
    Animated.timing(breatheAnim, { toValue: 1.1, duration: 2200, useNativeDriver: true }),
    Animated.timing(breatheAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
  ])).start();
}, []);

// Rotate home messages
useEffect(() => {
  const i = setInterval(() => setHomeMessageIndex(p => (p + 1) % HOME_MESSAGES.length), 5000);
  return () => clearInterval(i);
}, []);

const selectMood = (m: string) => {
  setMood(m);
  setMoodHistory(h => [{ id: Date.now(), mood: m, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() }, ...h]);
};

const saveEntry = () => {
  if (!journalText.trim()) return;
  setEntries(e => [{ id: Date.now(), text: journalText, mood, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() }, ...e]);
  setJournalText('');
};

const saveCirclePost = () => {
  if (!circlePostText.trim()) return;
  setCirclePosts(p => [{ id: Date.now(), text: circlePostText, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), reactions: { felt: 0, comfort: 0, proud: 0, stay: 0 } }, ...p]);
  setCirclePostText('');
};

const reactToPost = (id: number, type: string) => {
  setCirclePosts(posts => posts.map(p => p.id === id ? { ...p, reactions: { ...p.reactions, [type]: p.reactions[type] + 1 } } : p));
};

const getDynamicTags = () => {
  if (selectedSekret === 'rylane') return ['focused','mind heavy','protecting my peace','trying harder','locked in','building myself'];
  if (selectedSekret === 'soft')   return ['soft but strong','healing','trying my best','late night thoughts','emotional','peaceful'];
  if (selectedSekret === 'cloud')  return ['resting','breathing','quiet','healing','calm','soft day'];
  return ['good vibes','overthinking','protecting my peace','growing','learning myself','late night thoughts'];
};

const startRecording = () => {
  setIsRecording(true);
  pulseLoop.current = Animated.loop(Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
    Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
  ]));
  pulseLoop.current.start();
};

const stopRecording = () => {
  setIsRecording(false);
  pulseLoop.current?.stop();
  pulseAnim.setValue(1);
  setVoiceNotes(n => [{ id: Date.now(), title: 'Voice Bip', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), duration: '~30s' }, ...n]);
};
I need you to add these to using Se’kret 