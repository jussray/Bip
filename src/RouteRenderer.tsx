/**
 * RouteRenderer
 * Owns the screen → component mapping. AppContent delegates here.
 */
import React from 'react';
import { HomeScreen }           from '../screens/HomeScreen';
import { RoomScreen }           from '../screens/RoomScreen';
import { PagesScreen }          from '../screens/PagesScreen';
import { ParentPagesScreen }    from '../screens/ParentPagesScreen';
import { CalmScreen }           from '../screens/CalmScreen';
import { SekretScreen }         from '../screens/SekretScreen';
import { CircleScreen }         from '../screens/CircleScreen';
import { ParentCircleScreen }   from '../screens/ParentCircleScreen';
import { Bippin2Screen }        from '../screens/Bippin2Screen';
import { GrowthScreen }         from '../screens/GrowthScreen';
import { WomanhoodScreen }      from '../screens/WomanhoodScreen';
import { ManhoodScreen }        from '../screens/ManhoodScreen';
import { HistoryScreen }        from '../screens/HistoryScreen';
import { ComfortStreaksScreen } from '../screens/ComfortStreaksScreen';
import { BipCrewScreen }        from '../screens/BipCrewScreen';
import { PointsScreen }         from '../screens/PointsScreen';
import { ComfortScreen }        from '../screens/ComfortScreen';
import { MindBodyResetScreen }  from '../screens/MindBodyResetScreen';
import { BridgeScreen }         from '../screens/BridgeScreen';
import { ParentBridgeScreen }   from '../screens/ParentBridgeScreen';
import { S2TellScreen }         from '../screens/S2TellScreen';
import { ParentRoomScreen }     from '../screens/ParentRoomScreen';
import { MoreScreen }           from '../screens/MoreScreen';
import { SettingsScreen }       from '../screens/SettingsScreen';
import { PeriodCalendarScreen } from '../screens/PeriodCalendarScreen';
import { VoiceBipScreen }       from '../screens/VoiceBipScreen';
import { CloudThoughtsScreen }  from '../screens/CloudThoughtsScreen';

export function RouteRenderer({ s, t, vibeKey, currentSekret, companion, syncStatus, withSyncWrap, sleepWindow, setSleepWindow, actions, nav, getActiveCharacter }: any): React.ReactNode {
  const {
    screen, setScreen, userSide, setUserSide, theme, setTheme,
    selectedSekret, setSelectedSekret, sekretMode, setSekretMode,
    mood, setMood, journalText, setJournalText,
    journalEntries, moodHistory, voiceNotes, comfortSessions,
    circlePosts, circlePostText, setCirclePostText,
    parentCirclePosts, parentCirclePostText, setParentCirclePostText,
    parentPagesDraft, setParentPagesDraft, parentPagesEntries,
    oracleProfile, parentOracleProfile, oracleJournalEntries, setOracleJournalEntries,
    crewMembers, setCrewMembers, crewCheckIns, setCrewCheckIns,
    streakDays, streakJustReset,
    parentMood, setParentMood, parentMoodDate, parentRoomStyle, setParentRoomStyle,
    parentVoiceNotes, setParentVoiceNotes,
    homeMessageIndex,
  } = s;

  if (screen === 'home') {
    if (userSide === 'parent') {
      const today = new Date().toLocaleDateString();
      const previousMood = (parentMoodDate && parentMoodDate !== today) ? parentMood : '';
      return (
        <ParentRoomScreen
          parentRoomStyle={parentRoomStyle}
          parentMood={parentMood}
          previousMood={previousMood}
          setParentMood={(m: string) => { setParentMood(m); s.setParentMoodDate(new Date().toLocaleDateString()); }}
          setScreen={setScreen}
          weatherMode={theme === 'rain' ? 'rain' : undefined}
          BottomNav={nav}
        />
      );
    }
    return (
      <RoomScreen
        mood={mood} selectedSekret={selectedSekret}
        setSelectedSekret={(val: string) => setSelectedSekret(val)}
        setScreen={setScreen} t={t}
        updateRoomMemory={actions.updateRoomMemory}
        vibe={vibeKey} companion={companion}
        sekretMode={selectedSekret} BottomNav={nav}
      />
    );
  }

  if (screen === 'dashboard') return (
    <HomeScreen
      mood={mood} selectMood={actions.selectMood} t={t}
      currentSekret={currentSekret} selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex} userSide={userSide}
      setScreen={setScreen} onMoodSelect={() => actions.trackActivity('mood')}
      BottomNav={nav} streakDays={streakDays} streakJustReset={streakJustReset}
      companion={companion} syncStatus={syncStatus}
    />
  );

  if (screen === 'cloudThoughts') return (
    <CloudThoughtsScreen
      t={t} mood={mood} selectedSekret={selectedSekret}
      character={getActiveCharacter(selectedSekret)} setScreen={setScreen}
      BottomNav={nav}
      privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
      profileSide={userSide}
    />
  );

  if (screen === 'periodCalendar') return (
    <PeriodCalendarScreen theme={t} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} />
  );

  if (screen === 'voiceBip') return (
    <VoiceBipScreen
      theme={t} setScreen={setScreen} selectedSekret={selectedSekret}
      onSelectAvatar={(k: string) => setSelectedSekret(k)}
      weatherMode={theme === 'rain' ? 'rain' : undefined}
      voiceNotes={userSide === 'parent' ? parentVoiceNotes : voiceNotes}
      setVoiceNotes={userSide === 'parent' ? setParentVoiceNotes : s.setVoiceNotes}
      onSave={(note: any) => {
        if (userSide === 'teen') void withSyncWrap(async () => (await import('../utils/sync')).syncVoiceNote(note));
        actions.trackActivity('voice');
      }}
      mood={mood} companion={userSide === 'parent' ? undefined : companion}
      BottomNav={nav}
      privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
      profileSide={userSide}
      syncStatus={userSide === 'teen' ? syncStatus : undefined}
      oracleJournalEntries={userSide === 'teen' ? oracleJournalEntries : []}
      onStoreOracleMemory={(entry: any) => {
        if (userSide === 'teen') setOracleJournalEntries((cur: any[]) => [entry, ...cur].slice(0, 250));
      }}
    />
  );

  if (screen === 'pages') return userSide === 'parent' ? (
    <ParentPagesScreen
      entries={parentPagesEntries} draft={parentPagesDraft}
      setDraft={setParentPagesDraft} onSave={actions.saveParentPageEntry}
      mood={parentMood || mood} setScreen={setScreen} BottomNav={nav}
      parentRoomStyle={parentRoomStyle}
      weatherMode={theme === 'rain' ? 'rain' : undefined}
      oracleProfile={parentOracleProfile}
      onCompleteOracleSession={actions.completeParentOracleSession}
    />
  ) : (
    <PagesScreen
      journalText={journalText} setJournalText={setJournalText}
      journalEntries={journalEntries}
      saveJournalEntry={actions.saveJournalEntry}
      oracleProfile={oracleProfile}
      onCompleteOracleSession={actions.completeTeenOracleSession}
      onSekretReply={actions.patchJournalEntry}
      mood={mood} t={t} setScreen={setScreen} BottomNav={nav}
      moodHistory={moodHistory} voiceNotes={voiceNotes}
      streakDays={streakDays} selectedSekret={selectedSekret} syncStatus={syncStatus}
    />
  );

  if (screen === 'calm') return (
    <CalmScreen t={t} mood={mood} setMood={setMood} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} />
  );

  if (screen === 'sekret') return (
    <SekretScreen
      t={t} mood={mood} currentSekret={currentSekret}
      selectedProfile={selectedSekret} setSelectedProfile={setSelectedSekret}
      userSide={userSide} setScreen={setScreen} BottomNav={nav}
      privateProfile={userSide === 'parent' ? parentOracleProfile : oracleProfile}
    />
  );

  if (screen === 'circle') {
    if (userSide === 'parent') return (
      <ParentCircleScreen
        parentCirclePosts={parentCirclePosts}
        parentCirclePostText={parentCirclePostText}
        setParentCirclePostText={setParentCirclePostText}
        saveParentCirclePost={actions.saveParentCirclePost}
        reactToParentPost={actions.reactToParentPost}
        setScreen={setScreen} BottomNav={nav}
      />
    );
    return (
      <CircleScreen
        t={t} circlePosts={circlePosts} circlePostText={circlePostText}
        setCirclePostText={setCirclePostText}
        saveCirclePost={actions.saveCirclePost} reactToPost={actions.reactToPost}
        setScreen={setScreen} BottomNav={nav}
        selectedSekret={selectedSekret} mood={mood} syncStatus={syncStatus}
      />
    );
  }

  if (screen === 'bridge') return (
    <BridgeScreen t={t} currentSekret={currentSekret} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} />
  );

  if (screen === 's2tell') return (
    <S2TellScreen t={t} setScreen={setScreen} BottomNav={nav} selectedSekret={selectedSekret} mood={mood} privateProfile={oracleProfile} />
  );

  if (screen === 'parentBridge') return (
    <ParentBridgeScreen t={t} setScreen={setScreen} BottomNav={nav} />
  );

  if (screen === 'bippin2') return (
    <Bippin2Screen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} onMilestone={() => actions.trackActivity('growth')} streakDays={streakDays} BottomNav={nav} />
  );

  if (screen === 'growth') return (
    <GrowthScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} onMilestone={() => actions.trackActivity('growth')} streakDays={streakDays} BottomNav={nav} />
  );

  if (screen === 'womanhood') return (
    <WomanhoodScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={streakDays} />
  );

  if (screen === 'manhood') return (
    <ManhoodScreen t={t} mood={mood} selectedSekret={selectedSekret} setScreen={setScreen} BottomNav={nav} streakDays={streakDays} />
  );

  if (screen === 'comfort') return (
    <ComfortScreen
      t={t} setScreen={setScreen} onComplete={() => actions.trackActivity('comfort')}
      BottomNav={nav} selectedSekret={selectedSekret}
      character={getActiveCharacter(selectedSekret)} mood={mood}
      companion={companion} syncStatus={syncStatus}
    />
  );

  if (screen === 'mindReset' || screen === 'bodyReset') return (
    <MindBodyResetScreen
      screen={screen as 'mindReset' | 'bodyReset'} t={t}
      selectedSekret={selectedSekret} setScreen={setScreen}
      onComplete={() => actions.trackActivity('calm')} BottomNav={nav} mood={mood}
    />
  );

  if (screen === 'points') return (
    <PointsScreen
      t={t} mood={mood} selectedSekret={selectedSekret} moodHistory={moodHistory}
      journalEntries={journalEntries} voiceNotes={voiceNotes} circlePosts={circlePosts}
      comfortSessions={comfortSessions} crewCheckIns={crewCheckIns}
      streakDays={streakDays} setScreen={setScreen} BottomNav={nav}
    />
  );

  if (screen === 'crew') return (
    <BipCrewScreen
      t={t} mood={mood} selectedSekret={selectedSekret}
      crewMembers={crewMembers} setCrewMembers={setCrewMembers}
      crewCheckIns={crewCheckIns} setCrewCheckIns={setCrewCheckIns}
      setScreen={setScreen} BottomNav={nav} syncStatus={syncStatus} withSyncWrap={withSyncWrap}
    />
  );

  if (screen === 'comfortStreaks') return (
    <ComfortStreaksScreen t={t} mood={mood} selectedSekret={selectedSekret} comfortSessions={comfortSessions} setScreen={setScreen} BottomNav={nav} />
  );

  if (screen === 'history') return (
    <HistoryScreen
      t={t} mood={mood} selectedSekret={selectedSekret} moodHistory={moodHistory}
      journalEntries={journalEntries} voiceNotes={voiceNotes} circlePosts={circlePosts}
      streakDays={streakDays} setScreen={setScreen} BottomNav={nav}
    />
  );

  if (screen === 'more') return (
    <MoreScreen
      t={t} userSide={userSide}
      setUserSide={(side: string) => setUserSide(side as 'teen' | 'parent')}
      onSideChanged={() => setScreen('splash')}
      setScreen={setScreen} BottomNav={nav} mood={mood} selectedSekret={selectedSekret}
    />
  );

  if (screen === 'settings') return (
    <SettingsScreen
      t={t} theme={theme} setTheme={setTheme}
      selectedSekret={selectedSekret} setSelectedSekret={setSelectedSekret}
      sekretMode={sekretMode} setSekretMode={setSekretMode}
      userSide={userSide} setUserSide={setUserSide}
      setScreen={setScreen} BottomNav={nav}
      sleepWindow={sleepWindow} setSleepWindow={setSleepWindow}
      parentRoomStyle={parentRoomStyle} setParentRoomStyle={setParentRoomStyle}
    />
  );

  // Fallback
  return (
    <RoomScreen
      mood={mood} selectedSekret={selectedSekret}
      setSelectedSekret={(val: string) => setSelectedSekret(val)}
      setScreen={setScreen} t={t}
      updateRoomMemory={actions.updateRoomMemory}
      vibe={vibeKey} companion={companion}
      sekretMode={selectedSekret} BottomNav={nav}
    />
  );
}
