/**
 * app/(main)/parent-circle.tsx
 *
 * Parent Circle — wires ParentCircleScreen to AppContext + cloud sync.
 *
 * Mount flow:
 *   1. Screen renders immediately with local state (AsyncStorage, instant).
 *   2. loadParentCircleFeed() runs in the background.
 *   3. Cloud posts are merged additively: any id not already in local state
 *      is prepended so nothing the user wrote offline is lost.
 *
 * Pull-to-refresh repeats the same merge.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { syncParentCirclePost, loadParentCircleFeed } from '@/utils/sync';
import { ParentCircleScreen } from '@screens/ParentCircleScreen';
import type { ParentCirclePost } from '@/types';

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

  /**
   * mergeCloudPosts
   * Pulls parent_circle_posts from Supabase and prepends any rows whose id
   * is not already present in local state. Additive only — never removes
   * local posts that haven't synced yet.
   */
  const mergeCloudPosts = useCallback(async () => {
    const cloud = await loadParentCircleFeed();
    if (!cloud.length) return;
    setParentCirclePosts((local: ParentCirclePost[]) => {
      const localIds = new Set(local.map((p: ParentCirclePost) => String(p.id)));
      const newFromCloud = cloud.filter(p => !localIds.has(String(p.id)));
      if (!newFromCloud.length) return local;
      return [...newFromCloud, ...local];
    });
  }, [setParentCirclePosts]);

  // On mount: push any unsaved local posts, then pull cloud posts.
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
    void mergeCloudPosts();
    }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mergeCloudPosts();
    setRefreshing(false);
  }, [mergeCloudPosts]);

  function handleSave() {
    if (!parentCirclePostText.trim()) return;
    const text = parentCirclePostText.trim();
    const now = new Date();
    saveParentCirclePost();
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
      onPostPress={(id) => router.push(`/(parent)/circle/${id}` as any)}
    />
  );
}
