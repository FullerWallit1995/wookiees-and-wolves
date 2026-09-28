import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Category = 'pack' | 'cantina';
type Filter = 'all' | Category;

type Post = {
  id: number;
  type: 'post';
  category: Category;
  text: string;
  likes: number;
  time: string;
};

type PollOption = {
  id: string;
  text: string;
  votes: number;
};

type Poll = {
  id: number;
  type: 'poll';
  category: Category;
  question: string;
  options: PollOption[];
  time: string;
};

type FeedItem = Post | Poll;
function formatFeedTime(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();

  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'NOW';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  if (diffDays === 1) {
    return 'YESTERDAY';
  }

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return created
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}


export default function DenScreen() {
  const params = useLocalSearchParams<{
  filter?: string;
}>();
const router = useRouter();
const [databasePosts, setDatabasePosts] = useState<Post[]>([]);
const [postsLoading, setPostsLoading] = useState(true);
const [databasePolls, setDatabasePolls] = useState<Poll[]>([]);
const [feedError, setFeedError] = useState(false);
const [pollsLoading, setPollsLoading] = useState(true);
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  async function loadPosts() {
    try {
      setPostsLoading(true);
      setFeedError(false);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
  console.log('Could not load Den posts:', error);
  setFeedError(true);
  return;
}

      const formattedPosts: Post[] = (data ?? []).map(
        (post) => ({
          id: post.id,
          type: 'post',
          category: post.category,
          text: post.content,
          likes: 0,
          time: formatFeedTime(post.created_at),
        })
      );

      setDatabasePosts(formattedPosts);
    } finally {
      setPostsLoading(false);
    }
  }

  loadPosts();
}, []);
  useEffect(() => {
  async function loadPolls() {
    try {
      setPollsLoading(true);

      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (pollsError) {
  console.log('Could not load Den polls:', pollsError);
  setFeedError(true);
  return;
}

      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (optionsError) {
  console.log('Could not load poll options:', optionsError);
  setFeedError(true);
  return;
}

      const formattedPolls: Poll[] = (polls ?? []).map((poll) => ({
        id: poll.id,
        type: 'poll',
        category: poll.category,
        question: poll.question,
        time: formatFeedTime(poll.created_at),

        options: (options ?? [])
          .filter((option) => option.poll_id === poll.id)
          .map((option) => ({
            id: String(option.id),
            text: option.option_text,
            votes: 0,
          })),
      }));

      setDatabasePolls(formattedPolls);
          } finally {
      setPollsLoading(false);
    }
    }

    loadPolls();
  }, []);
  useEffect(() => {
async function loadVotes() {
  if (!user) {
    setPollVotes({});
    return;
  }

    const { data: votes, error } = await supabase
      .from('poll_votes')
      .select('*');

    if (error) {
      console.log('Could not load poll votes:', error);
      return;
    }

    const voteCounts: Record<string, number> = {};
    const myVotes: Record<number, string> = {};

    (votes ?? []).forEach((vote) => {
      const optionId = String(vote.option_id);

      voteCounts[optionId] =
        (voteCounts[optionId] ?? 0) + 1;

      const isMyVote = vote.user_id === user.id;

if (isMyVote) {
  myVotes[vote.poll_id] = optionId;
}
    });

    setPollVotes(myVotes);

    setDatabasePolls((currentPolls) =>
      currentPolls.map((poll) => ({
        ...poll,
        options: poll.options.map((option) => ({
          ...option,
          votes: voteCounts[option.id] ?? 0,
        })),
      }))
    );
  }

  loadVotes();
}, [user, databasePolls.length]);
useEffect(() => {
  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

useEffect(() => {
async function loadLikes() {
  if (!user) {
    setLikedPosts({});
    return;
  }

    const { data: likes, error } = await supabase
      .from('post_likes')
      .select('*');

    if (error) {
      console.log('Could not load post likes:', error);
      return;
    }

    const likeCounts: Record<number, number> = {};
    const myLikes: Record<number, boolean> = {};

    (likes ?? []).forEach((like) => {
      likeCounts[like.post_id] =
        (likeCounts[like.post_id] ?? 0) + 1;

      const isMyLike = like.user_id === user.id;

if (isMyLike) {
  myLikes[like.post_id] = true;
}
    });

    setLikedPosts(myLikes);

    setDatabasePosts((currentPosts) =>
      currentPosts.map((post) => ({
        ...post,
        likes: likeCounts[post.id] ?? 0,
      }))
    );
  }

  loadLikes();
}, [user, databasePosts.length]);
  const [activeFilter, setActiveFilter] =
  useState<Filter>('all');
useEffect(() => {
  if (params.filter === 'pack') {
    setActiveFilter('pack');
    return;
  }

  if (params.filter === 'cantina') {
    setActiveFilter('cantina');
    return;
  }

  setActiveFilter('all');
}, [params.filter]);
  const [likedPosts, setLikedPosts] =
    useState<Record<number, boolean>>({});

  const [pollVotes, setPollVotes] =
    useState<Record<number, string>>({});

const combinedFeed: FeedItem[] = [
  ...databasePosts,
  ...databasePolls,
];

const visibleFeed = useMemo(() => {
  if (activeFilter === 'all') {
    return combinedFeed;
  }
  return combinedFeed.filter(
    (item) => item.category === activeFilter
  );
}, [activeFilter, databasePosts, databasePolls]);
const feedLoading =
  postsLoading || pollsLoading;
function promptSignIn() {
  Alert.alert(
    'Join the conversation',
    'Sign in to like posts and vote in The Den.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Sign In',
        onPress: () =>
          router.push({
            pathname: '/auth',
            params: { mode: 'login' },
          }),
      },
    ]
  );
}
async function toggleLike(postId: number) {
  if (!user) {
    promptSignIn();
    return;
  }

  const alreadyLiked = !!likedPosts[postId];

  if (alreadyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.log('Could not remove like:', error);
      return;
    }
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
        device_id: null,
      });

    if (error) {
      console.log('Could not add like:', error);
      return;
    }
  }

  setLikedPosts((current) => ({
    ...current,
    [postId]: !alreadyLiked,
  }));

  setDatabasePosts((currentPosts) =>
    currentPosts.map((post) => {
      if (post.id !== postId) {
        return post;
      }

      return {
        ...post,
        likes: Math.max(
          0,
          post.likes + (alreadyLiked ? -1 : 1)
        ),
      };
    })
  );
}

async function vote(
  pollId: number,
  optionId: string
) {
  if (!user) {
    promptSignIn();
    return;
  }

  const numericOptionId = Number(optionId);

  const { data: existingVote, error: lookupError } =
    await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .maybeSingle();

  if (lookupError) {
    console.log('Could not find existing vote:', lookupError);
    return;
  }

  if (existingVote) {
    const { error } = await supabase
      .from('poll_votes')
      .update({
        option_id: numericOptionId,
      })
      .eq('id', existingVote.id);

    if (error) {
      console.log('Could not change vote:', error);
      return;
    }
  } else {
    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: numericOptionId,
        user_id: user.id,
        device_id: null,
      });

    if (error) {
      console.log('Could not save vote:', error);
      return;
    }
  }

  const previousOptionId = pollVotes[pollId];

  setPollVotes((current) => ({
    ...current,
    [pollId]: optionId,
  }));

  setDatabasePolls((currentPolls) =>
    currentPolls.map((poll) => {
      if (poll.id !== pollId) {
        return poll;
      }

      return {
        ...poll,
        options: poll.options.map((option) => {
          let newVoteCount = option.votes;

          if (
            previousOptionId &&
            option.id === previousOptionId
          ) {
            newVoteCount -= 1;
          }

          if (option.id === optionId) {
            newVoteCount += 1;
          }

          return {
            ...option,
            votes: Math.max(0, newVoteCount),
          };
        }),
      };
    })
  );
}

  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <Text style={styles.eyebrow}>W&W COMMUNITY</Text>
        <Text style={styles.title}>The Den</Text>

        <Text style={styles.subtitle}>
          Two fandoms. One community.
        </Text>

        {/* FILTERS */}
        <View style={styles.filters}>
          <FilterButton
            label="ALL"
            active={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />

          <FilterButton
            label="THE PACK"
            active={activeFilter === 'pack'}
            onPress={() => setActiveFilter('pack')}
          />

          <FilterButton
            label="THE CANTINA"
            active={activeFilter === 'cantina'}
            onPress={() => setActiveFilter('cantina')}
          />
        </View>

        {/* FEED */}
{feedLoading ? (
  <View style={styles.feedStatusCard}>
    <Text style={styles.feedStatusText}>
      Loading The Den...
    </Text>
  </View>
) : feedError ? (
  <View style={styles.feedStatusCard}>
    <Text style={styles.feedStatusTitle}>
      Couldn't load The Den
    </Text>

    <Text style={styles.feedStatusText}>
      Something went wrong loading the community feed.
    </Text>
  </View>
) : visibleFeed.length === 0 ? (
  <View style={styles.feedStatusCard}>
    <Text style={styles.feedStatusTitle}>
      {activeFilter === 'pack'
        ? 'Nothing from The Pack yet'
        : activeFilter === 'cantina'
          ? 'Nothing from The Cantina yet'
          : 'Nothing in The Den yet'}
    </Text>

    <Text style={styles.feedStatusText}>
      Check back soon for new discussions and polls.
    </Text>
  </View>
) : (
  visibleFeed.map((item) => {
          if (item.type === 'post') {
            const liked = !!likedPosts[item.id];

            return (
<View key={`post-${item.id}`} style={styles.card}>              
      <FeedHeader
                  category={item.category}
                  time={item.time}
                />

                <Text style={styles.postText}>
                  {item.text}
                </Text>

                <View style={styles.postActions}>
                  <Pressable
                    style={[
                      styles.likeButton,
                      liked && styles.likeButtonActive,
                    ]}
                    onPress={() => toggleLike(item.id)}
                  >
                    <Text
                      style={[
                        styles.likeIcon,
                        liked && styles.likeIconActive,
                      ]}
                    >
                      {liked ? '♥' : '♡'}
                    </Text>

                    <Text
                      style={[
                        styles.likeText,
                        liked && styles.likeTextActive,
                      ]}
                    >
{item.likes}                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          const selectedOption = pollVotes[item.id];

          const totalVotes =
  item.options.reduce(
    (total, option) => total + option.votes,
    0
  );

          return (
  <View key={`poll-${item.id}`} style={styles.card}>
    <FeedHeader
      category={item.category}
      time={item.time}
      poll
    />

              <Text style={styles.pollQuestion}>
                {item.question}
              </Text>

              <View style={styles.pollOptions}>
                {item.options.map((option) => {
                  const selected =
                    selectedOption === option.id;

                  const displayVotes = option.votes;

                  const percentage =
                    totalVotes > 0
                      ? Math.round(
                          (displayVotes / totalVotes) * 100
                        )
                      : 0;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.pollOption,
                        selected &&
                          styles.pollOptionSelected,
                      ]}
                      onPress={() => {
  vote(item.id, option.id);
}}
                    >
                      <View
                        style={[
                          styles.pollIndicator,
                          selected &&
                            styles.pollIndicatorSelected,
                        ]}
                      >
                        {selected && (
                          <View
                            style={styles.pollIndicatorDot}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.pollOptionText,
                          selected &&
                            styles.pollOptionTextSelected,
                        ]}
                      >
                        {option.text}
                      </Text>

                      {selectedOption && (
                        <Text style={styles.pollPercentage}>
                          {percentage}%
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.voteCount}>
                {totalVotes} votes
              </Text>
            </View>
          );
          })
)}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FeedHeader({
  category,
  time,
  poll = false,
}: {
  category: Category;
  time: string;
  poll?: boolean;
}) {
  const categoryName =
    category === 'pack' ? 'THE PACK' : 'THE CANTINA';

  return (
    <View style={styles.feedHeader}>
      <View style={styles.feedHeaderLeft}>
        <View
          style={[
            styles.categoryBadge,
            category === 'cantina' &&
              styles.cantinaBadge,
          ]}
        >
          <Text style={styles.categoryText}>
            {categoryName}
          </Text>
        </View>

        <View
  style={[
    styles.typeBadge,
    poll && styles.pollBadge,
  ]}
>
  <Text
    style={[
      styles.typeBadgeText,
      poll && styles.pollBadgeText,
    ]}
  >
    {poll ? 'POLL' : 'POST'}
  </Text>
</View>
      </View>

      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },

  eyebrow: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
  },

  title: {
    color: '#F3EFE3',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  subtitle: {
    color: '#8FA2B3',
    fontSize: 15,
    marginTop: 7,
    marginBottom: 22,
  },

  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },

  filterButton: {
    flex: 1,
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },

  filterButtonActive: {
    backgroundColor: '#75C7F0',
    borderColor: '#75C7F0',
  },

  filterText: {
    color: '#8FA2B3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  filterTextActive: {
    color: '#07111F',
  },

  card: {
    backgroundColor: '#101D2B',
    borderWidth: 1,
    borderColor: '#20354A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  feedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  categoryBadge: {
    backgroundColor: '#16425B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  cantinaBadge: {
    backgroundColor: '#355044',
  },

  categoryText: {
    color: '#F3EFE3',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  pollBadge: {
    backgroundColor: '#2B243D',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  pollBadgeText: {
    color: '#C7B8E7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  time: {
    color: '#60778A',
    fontSize: 11,
    fontWeight: '700',
  },

  postText: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },

  postActions: {
    flexDirection: 'row',
    marginTop: 18,
  },

  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  likeButtonActive: {
    backgroundColor: '#2C1E25',
    borderColor: '#6C3C4B',
  },

  likeIcon: {
    color: '#8FA2B3',
    fontSize: 19,
  },

  likeIconActive: {
    color: '#D77A91',
  },

  likeText: {
    color: '#8FA2B3',
    fontSize: 12,
    fontWeight: '800',
  },

  likeTextActive: {
    color: '#DFA0B0',
  },

  pollQuestion: {
    color: '#F3EFE3',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 25,
    marginBottom: 16,
  },

  pollOptions: {
    gap: 8,
  },

  pollOption: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#2A4053',
    borderRadius: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pollOptionSelected: {
    backgroundColor: '#142B3D',
    borderColor: '#75C7F0',
  },

  pollIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#53697B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  pollIndicatorSelected: {
    borderColor: '#75C7F0',
  },

  pollIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#75C7F0',
  },

  pollOptionText: {
    color: '#B6C2CC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },

  pollOptionTextSelected: {
    color: '#F3EFE3',
  },

  pollPercentage: {
    color: '#75C7F0',
    fontSize: 12,
    fontWeight: '900',
  },
feedStatusCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#20354A',
  borderRadius: 18,
  padding: 22,
  alignItems: 'center',
},

feedStatusTitle: {
  color: '#F3EFE3',
  fontSize: 16,
  fontWeight: '900',
  textAlign: 'center',
},

feedStatusText: {
  color: '#8FA2B3',
  fontSize: 13,
  lineHeight: 19,
  textAlign: 'center',
  marginTop: 5,
},
  voteCount: {
    color: '#60778A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
  },
  typeBadge: {
  backgroundColor: '#24313D',
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 5,
},

typeBadgeText: {
  color: '#9DAFBD',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1,
},
});