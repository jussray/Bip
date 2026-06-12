import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  analyzeOracleAnswer,
  completeOracleSession,
  normalizeOracleProfile,
  selectOracleFollowUp,
  selectOracleOpening,
  shouldCompleteOracleSession,
  type OracleAnswerSignal,
  type OracleProfile,
  type OracleSessionSummary,
  type OracleSide,
} from '../services/oracleDiscovery';

interface OracleDiscoveryPanelProps {
  side: OracleSide;
  profile?: OracleProfile;
  accent: string;
  onComplete: (profile: OracleProfile, session: OracleSessionSummary) => void;
}

export function OracleDiscoveryPanel({ side, profile: profileValue, accent, onComplete }: OracleDiscoveryPanelProps) {
  const profile = useMemo(() => normalizeOracleProfile(profileValue, side), [profileValue, side]);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [opening, setOpening] = useState(() => selectOracleOpening(profile, side));
  const [currentQuestion, setCurrentQuestion] = useState(opening);
  const [answer, setAnswer] = useState('');
  const [turns, setTurns] = useState<{ question: string; answer: string }[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [signals, setSignals] = useState<OracleAnswerSignal[]>([]);
  const [completion, setCompletion] = useState<'saved' | 'open' | null>(null);

  const reset = () => {
    const nextOpening = selectOracleOpening(profile, side);
    setStartedAt(new Date().toISOString());
    setOpening(nextOpening);
    setCurrentQuestion(nextOpening);
    setAnswer('');
    setTurns([]);
    setQuestionIds([]);
    setSignals([]);
    setCompletion(null);
  };

  const continueSession = () => {
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;

    const signal = analyzeOracleAnswer(currentQuestion, cleanAnswer);
    const nextTurns = [...turns, { question: currentQuestion.text, answer: cleanAnswer }];
    const nextQuestionIds = [...questionIds, currentQuestion.id];
    const nextSignals = [...signals, signal];
    const theoryCount = new Set(nextSignals.flatMap(item => item.theories)).size;

    setTurns(nextTurns);
    setQuestionIds(nextQuestionIds);
    setSignals(nextSignals);
    setAnswer('');

    if (shouldCompleteOracleSession(nextTurns.length, cleanAnswer, theoryCount)) {
      const result = completeOracleSession(profile, side, startedAt, nextQuestionIds, nextSignals);
      onComplete(result.profile, result.session);
      setCompletion(result.session.understandings.length ? 'saved' : 'open');
      return;
    }

    setCurrentQuestion(selectOracleFollowUp(opening, nextTurns.length));
  };

  if (completion) {
    return (
      <View style={[styles.completion, { borderColor: `${accent}66` }]}>
        <Text style={styles.completionTitle}>That’s enough for now.</Text>
        <Text style={styles.completionText}>
          {completion === 'saved'
            ? 'Se’kret saved an evolving understanding — not a label, and not a transcript.'
            : 'Se’kret didn’t force a conclusion. You can discover something else another time.'}
        </Text>
        <TouchableOpacity onPress={reset} style={[styles.again, { borderColor: accent }]}>
          <Text style={[styles.againText, { color: accent }]}>start another discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: accent }]}>SE’KRET DISCOVERY</Text>
        <Text style={styles.question}>{currentQuestion.text}</Text>
        <Text style={styles.progress}>{turns.length + 1} of up to 5 · curious, not corrective</Text>
      </View>

      {turns.length ? (
        <View style={styles.trail}>
          {turns.map((turn, index) => (
            <View key={`${index}-${turn.question}`} style={[styles.trailItem, { borderLeftColor: `${accent}66` }]}>
              <Text style={styles.trailQuestion}>{turn.question}</Text>
              <Text style={styles.trailAnswer}>{turn.answer}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.paper, { borderColor: `${accent}70` }]}>
        <TextInput
          multiline
          value={answer}
          onChangeText={setAnswer}
          placeholder="Answer in your own words…"
          placeholderTextColor="#736c82"
          style={styles.input}
          textAlignVertical="top"
        />
      </View>
      <TouchableOpacity
        disabled={!answer.trim()}
        onPress={continueSession}
        style={[styles.continueButton, { backgroundColor: accent }, !answer.trim() && styles.disabled]}
      >
        <Text style={styles.continueText}>continue</Text>
      </TouchableOpacity>
      <Text style={styles.privacy}>
        {side === 'teen'
          ? 'Se’kret remembers evolving meanings, not a transcript. Teen discovery stays out of Parent Pages.'
          : 'Se’kret is learning about you, not your teen. Parent discovery stays separate from Teen Pages.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 7 },
  question: { color: '#f0eaf4', fontSize: 23, lineHeight: 31, fontWeight: '700' },
  progress: { color: '#81798b', fontSize: 11, marginTop: 8 },
  trail: { marginBottom: 14, gap: 8 },
  trailItem: { borderLeftWidth: 2, paddingLeft: 11 },
  trailQuestion: { color: '#938a9f', fontSize: 11, lineHeight: 16 },
  trailAnswer: { color: '#d8d0dd', fontSize: 13, lineHeight: 19, marginTop: 3 },
  paper: { minHeight: 245, backgroundColor: '#f4efe7', borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  input: { minHeight: 245, color: '#27212c', fontSize: 17, lineHeight: 29, padding: 18 },
  continueButton: { alignSelf: 'flex-end', borderRadius: 13, paddingHorizontal: 20, paddingVertical: 12, marginTop: 12 },
  continueText: { color: '#171018', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.3 },
  privacy: { color: '#77707f', fontSize: 10, lineHeight: 15, marginTop: 13 },
  completion: { borderWidth: 1, backgroundColor: '#ffffff08', borderRadius: 18, padding: 20 },
  completionTitle: { color: '#f0eaf4', fontSize: 21, fontWeight: '700' },
  completionText: { color: '#aaa2b7', fontSize: 14, lineHeight: 21, marginTop: 8 },
  again: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 18 },
  againText: { fontSize: 12, fontWeight: '700' },
});
