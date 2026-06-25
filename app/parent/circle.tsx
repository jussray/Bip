import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import {
  loadCircleFeed,
  writeCirclePost,
  syncCircleReaction,
  writeCircleComment,
} from '@/utils/sync';
import { ParentCircleScreen } from '@screens/ParentCircleScreen';
import type { ParentCirclePost } from '../../types/index';

export default function ParentCircleRoute() {
  const {
    parentCirclePosts, setParentCirclePosts,
    parentCirclePostText, setParentCirclePostText,
    saveParentCirclePost, reactToParentPost,
  } = useAppContext();

  const [refreshing, setRefreshing] = useState(false);

  const mergeCloudPosts = useCallback(async () => {
    const cloud = await loadCircleFeed('parent');
    if (!cloud || !cloud.length) return;
    setParentCirclePosts((local: ParentCirclePost[]) => {
      const localIds = new Set(local.map((p: ParentCirclePost) => String(p.id)));
      const newFromCloud = cloud.filter(p => !localIds.has(String((p as any).id)));
      if (!newFromCloud.length) return local;
      return [...(newFromCloud as unknown as ParentCirclePost[]), ...local];
    });
  }, [setParentCirclePosts]);

  useEffect(() => { void mergeCloudPosts(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mergeCloudPosts();
    setRefreshing(false);
  }, [mergeCloudPosts]);

  function handleSave(extra?: { circleTag?: string }) {
    if (!parentCirclePostText.trim()) return;
    const text = parentCirclePostText.trim();
    saveParentCirclePost();
    void writeCirclePost('parent', text, { circleTag: extra?.circleTag ?? undefined });
  }

  function handleReact(id: string | number, type: string) {
    reactToParentPost(Number(id), type);
    void syncCircleReaction(id, 'parent', type);
  }

  function handleQuietReply(postId: string | number, reply: string) {
    void writeCircleComment(Number(postId), 'parent', reply);
  }

  return (
    <ParentCircleScreen
      parentCirclePosts={parentCirclePosts}
      parentCirclePostText={parentCirclePostText}
      setParentCirclePostText={setParentCirclePostText}
      saveParentCirclePost={handleSave}
      reactToParentPost={handleReact}
      onSendQuietReply={handleQuietReply}
      setScreen={parentNavigateTo}
      BottomNav={null}
    />
  );
}
