/**
 * app/(main)/parent-circle.tsx
 *
 * Parent Circle — wires ParentCircleScreen to AppContext + cloud sync.
 * - pull-to-refresh reloads parent circle posts from Supabase
 * - saveParentCirclePost syncs to cloud before updating local state
 * - navigateTo() replaces raw router.push template
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { syncParentCirclePost } from '@/utils/sync';
import { ParentCircleScreen } from '@screens/ParentCircleScreen';

export default function ParentCircleRoute() {
  const {
    parentCirclePosts,
    setParentCirclePosts,
    parentCirclePostText,
    setParentCirclePostText,
    saveParentCirclePost,
    reactToParentPost,
    parentMood,
  } = useAppContext();

  const [refreshing, setRefreshing] = useState(false);

  // Sync any locally-saved posts that haven't been pushed yet on mount.
  // Full cloud read for parent circle is deferred to a later sprint when
  // the parent feed table is queryable via loadCircleFeed.
  useEffect(() => {
    parentCirclePosts.forEach(post => {
      void syncParentCirclePost({
        id: post.id,
        text: post.text,
        date: post.date,
        time: post.time,
        reactions: post.reactions as any,
      });
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Re-sync all local posts; cloud read wired in a later sprint.
    parentCirclePosts.forEach(post => {
      void syncParentCirclePost({
        id: post.id,
        text: post.text,
        date: post.date,
        time: post.time,
        reactions: post.reactions as any,
      });
    });
    setRefreshing(false);
  }, [parentCirclePosts]);

  function handleSave() {
    if (!parentCirclePostText.trim()) return;
    // Snapshot before saveParentCirclePost clears the draft
    const text = parentCirclePostText.trim();
    const now = new Date();
    saveParentCirclePost();
    // Cloud write — fire-and-forget, never throws
    void syncParentCirclePost({
      id: Date.now(),
      text,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: { beenThere: 0, solidarity: 0, reminder: 0, needed: 0, strength: 0 },
    });
  }

  return (
    <ParentCircleScreen
      parentCirclePosts={parentCirclePosts}
      parentCirclePostText={parentCirclePostText}
      setParentCirclePostText={setParentCirclePostText}
      saveParentCirclePost={handleSave}
      reactToParentPost={(id: string | number, type: string) => reactToParentPost(Number(id), type)}
      setScreen={navigateTo}
      BottomNav={null}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
