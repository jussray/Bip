import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import { syncParentCirclePost, loadParentCircleFeed } from '@/utils/sync';
import { ParentCircleScreen } from '@screens/ParentCircleScreen';
import type { ParentCirclePost } from '../../types/index';

export default function ParentCircleRoute() {
  const {
    parentCirclePosts, setParentCirclePosts,
    parentCirclePostText, setParentCirclePostText,
    saveParentCirclePost, reactToParentPost, parentMood,
  } = useAppContext();

  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    parentCirclePosts.forEach(post => {
      void syncParentCirclePost({
        id: post.id, text: post.text, date: post.date, time: post.time,
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
      id: Date.now(), text,
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
      setScreen={parentNavigateTo}
      BottomNav={null}
    />
  );
}
