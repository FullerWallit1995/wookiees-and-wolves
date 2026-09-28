import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type DenPreviewItem =
  | {
      id: number;
      type: 'post';
      category: 'pack' | 'cantina';
      text: string;
      likes: number;
      createdAt: string;
    }
  | {
      id: number;
      type: 'poll';
      category: 'pack' | 'cantina';
      text: string;
      votes: number;
      createdAt: string;
    };

export function useDenPreview() {
  const [items, setItems] = useState<DenPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);

      const [
        postsResult,
        pollsResult,
        likesResult,
        votesResult,
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id, category, content, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('polls')
          .select('id, category, question, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('post_likes')
          .select('post_id'),

        supabase
          .from('poll_votes')
          .select('poll_id'),
      ]);

      if (postsResult.error) {
        throw postsResult.error;
      }

      if (pollsResult.error) {
        throw pollsResult.error;
      }

      if (likesResult.error) {
        throw likesResult.error;
      }

      if (votesResult.error) {
        throw votesResult.error;
      }

      const likeCounts: Record<number, number> = {};
      const voteCounts: Record<number, number> = {};

      (likesResult.data ?? []).forEach((like) => {
        likeCounts[like.post_id] =
          (likeCounts[like.post_id] ?? 0) + 1;
      });

      (votesResult.data ?? []).forEach((vote) => {
        voteCounts[vote.poll_id] =
          (voteCounts[vote.poll_id] ?? 0) + 1;
      });

      const posts: DenPreviewItem[] =
        (postsResult.data ?? []).map((post) => ({
          id: post.id,
          type: 'post',
          category: post.category,
          text: post.content,
          likes: likeCounts[post.id] ?? 0,
          createdAt: post.created_at,
        }));

      const polls: DenPreviewItem[] =
        (pollsResult.data ?? []).map((poll) => ({
          id: poll.id,
          type: 'poll',
          category: poll.category,
          text: poll.question,
          votes: voteCounts[poll.id] ?? 0,
          createdAt: poll.created_at,
        }));

      const combined = [...posts, ...polls]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 2);

      setItems(combined);
    } catch (error) {
      console.log(
        'Could not load Den preview:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreview();
    }, [loadPreview])
  );

  return {
    items,
    loading,
  };
}