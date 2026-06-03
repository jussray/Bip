import React from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSekret } from './_layout';
import BottomNav from '../components/BottomNav';
import BackgroundLayer from '../components/BackgroundLayer';
import { C } from '../constants/theme';
import { BIP } from '../constants/bip_voice';

export default function BridgeScreen() {
  const { userSide, voiceKey, bridgeText, setBridgeText, selectedTone, setSelectedTone } = useSekret();

  const tones = [
    { id: 'softStart', label: BIP.BRIDGE.tones.softStart.label },
    { id: 'honest',    label: BIP.BRIDGE.tones.honest.label },
    { id: 'boundary',  label: BIP.BRIDGE.tones.boundary.label },
    { id: 'dontKnow',  label: BIP.BRIDGE.tones.dontKnow.label },
  ];

  const selectedQuote = BIP.BRIDGE.tones[selectedTone as keyof typeof BIP.BRIDGE.tones]?.quote;

  return (
    <BackgroundLayer screen="bridge" voiceKey={voiceKey as any}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scroll}>

          <Text style={styles.title}>{BIP.SEKRETS_2_TELL.title}</Text>
          <Text style={styles.sub}>{BIP.SEKRETS_2_TELL.subtitle}</Text>
          <Text style={styles.intro}>{BIP.SEKRETS_2_TELL.intro}</Text>

          {/* What's heavy */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{BIP.BRIDGE.bodyPrompt}</Text>
            <TextInput
              style={styles.input}
              placeholder={BIP.BRIDGE.inputPlaceholder}
              placeholderTextColor="#4a3d6b"
              multiline
              value={bridgeText}
              onChangeText={setBridgeText}
            />
          </View>

          {/* Who sees this */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{BIP.SEKRETS_2_TELL.whoSeesThis}</Text>
            {Object.entries(BIP.SEKRETS_2_TELL.audienceOptions).map(([id, opt]) => (
              <TouchableOpacity key={id} style={styles.audienceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toneText}>{opt.label}</Text>
                  <Text style={styles.toneSub}>{opt.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Choose a tone */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{BIP.BRIDGE.toneTitle}</Text>
            {tones.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTone(t.id)}
                style={[styles.tone, selectedTone === t.id && styles.active]}
              >
                <Text style={styles.toneText}>{t.label}</Text>
                {selectedTone === t.id && (
                  <Text style={styles.toneQuote}>
                    {BIP.BRIDGE.tones[t.id as keyof typeof BIP.BRIDGE.tones]?.quote}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Se'kret says */}
          <View style={[styles.card, styles.sekretCard]}>
            <Text style={styles.sekretLabel}>{BIP.BRIDGE.sekretSays}</Text>
            <Text style={styles.sekretText}>{BIP.BRIDGE.sekretMsg}</Text>
          </View>

          {/* Send button */}
          <TouchableOpacity style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>{BIP.SEKRETS_2_TELL.sendBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.justMeBtn}>
            <Text style={styles.justMeBtnText}>{BIP.SEKRETS_2_TELL.justMeBtn}</Text>
          </TouchableOpacity>

        </ScrollView>
        <BottomNav userSide={userSide} />
      </View>
    </BackgroundLayer>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: 'transparent' },
  scroll:       { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
  title:        { fontSize: 28, color: C.pinkHot, fontWeight: '800' },
  sub:          { color: C.lavender, marginBottom: 6, fontSize: 14 },
  intro:        { color: C.muted, marginBottom: 16, fontSize: 13, lineHeight: 20 },
  card:         { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardTitle:    { color: C.white, fontWeight: '700', marginBottom: 12 },
  input:        { minHeight: 110, color: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 12 },
  audienceRow:  { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  tone:         { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  active:       { borderColor: C.pinkHot, backgroundColor: 'rgba(124,58,237,0.25)' },
  toneText:     { color: C.lavender, fontWeight: '600' },
  toneSub:      { color: C.muted, fontSize: 11, marginTop: 2 },
  toneQuote:    { color: C.mutedLt, fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  sekretCard:   { borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(76,29,149,0.15)' },
  sekretLabel:  { color: C.pinkHot, fontWeight: '700', marginBottom: 6, fontSize: 13 },
  sekretText:   { color: C.lavender, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  sendBtn:      { backgroundColor: C.purple, borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 10 },
  sendBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  justMeBtn:    { borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  justMeBtnText:{ color: C.muted, fontSize: 13 },
});
