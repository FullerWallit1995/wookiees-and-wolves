import ProfileButton from '@/components/profile-button';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Category =
  | 'pack'
  | 'cantina'
  | 'both';
type Filter = 'all' | Category;
type ContentFilter = 'all' | 'post' | 'poll';

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
type DenFeedRow = {
  item_type: 'post' | 'poll';
  item_id: number;
  category: Category;
  content: string;
  created_at: string;
  options: {
    id: number;
    text: string;
    sort_order: number;
  }[] | null;
  total_count: number;
};

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
const [feedItems, setFeedItems] =
  useState<FeedItem[]>([]);

const [feedLoading, setFeedLoading] =
  useState(true);

const [feedError, setFeedError] =
  useState(false);

const [totalFeedCount, setTotalFeedCount] =
  useState(0);
  const [loadingMore, setLoadingMore] =
  useState(false);
const [user, setUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] =
  useState<Filter>('all');
  const [contentFilter, setContentFilter] =
  useState<ContentFilter>('all');
  const [searchText, setSearchText] =
  useState('');

const [activeSearch, setActiveSearch] =
  useState('');

async function loadFeed(
  offset = 0,
  append = false
) {
  try {
    if (append) {
      setLoadingMore(true);
    } else {
      setFeedLoading(true);
    }

    setFeedError(false);

    const { data, error } = await supabase.rpc(
      'get_den_feed',
      {
        p_category:
          activeFilter === 'all'
            ? null
            : activeFilter,
        p_type:
  contentFilter === 'all'
    ? null
    : contentFilter,
        p_search:
  activeSearch.trim() === ''
    ? null
    : activeSearch.trim(),
        p_limit: 20,
        p_offset: offset,
      }
    );

    if (error) {
      console.log(
        'Could not load Den feed:',
        error
      );

      setFeedError(true);
      return;
    }

    const rows =
      (data ?? []) as DenFeedRow[];

    const formattedFeed: FeedItem[] =
      rows.map((row) => {
        if (row.item_type === 'post') {
          return {
            id: row.item_id,
            type: 'post',
            category: row.category,
            text: row.content,
            likes: 0,
            time: formatFeedTime(
              row.created_at
            ),
          };
        }

        return {
          id: row.item_id,
          type: 'poll',
          category: row.category,
          question: row.content,
          time: formatFeedTime(
            row.created_at
          ),
          options: (row.options ?? []).map(
            (option) => ({
              id: String(option.id),
              text: option.text,
              votes: 0,
            })
          ),
        };
      });

    if (append) {
      setFeedItems((current) => [
        ...current,
        ...formattedFeed,
      ]);
    } else {
      setFeedItems(formattedFeed);
    }

    setTotalFeedCount(
      Number(rows[0]?.total_count ?? 0)
    );
  } finally {
    setFeedLoading(false);
    setLoadingMore(false);
  }
}
useEffect(() => {
  loadFeed(0, false);
}, [
  activeFilter,
  contentFilter,
  activeSearch,
]);

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

const visibleFeed = feedItems;


useEffect(() => {
  async function loadInteractions() {
    if (feedItems.length === 0) {
      setLikedPosts({});
      setPollVotes({});
      return;
    }

    const postIds = feedItems
      .filter(
        (item): item is Post =>
          item.type === 'post'
      )
      .map((item) => item.id);

    const pollIds = feedItems
      .filter(
        (item): item is Poll =>
          item.type === 'poll'
      )
      .map((item) => item.id);

    const [
      { data: likes, error: likesError },
      { data: votes, error: votesError },
    ] = await Promise.all([
      postIds.length > 0
        ? supabase
            .from('post_likes')
            .select('post_id, user_id')
            .in('post_id', postIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),

      pollIds.length > 0
        ? supabase
            .from('poll_votes')
            .select('poll_id, option_id, user_id')
            .in('poll_id', pollIds)
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

    if (likesError) {
      console.log(
        'Could not load post likes:',
        likesError
      );
    }

    if (votesError) {
      console.log(
        'Could not load poll votes:',
        votesError
      );
    }

    const likeCounts: Record<number, number> = {};
    const myLikes: Record<number, boolean> = {};

    (likes ?? []).forEach((like) => {
      likeCounts[like.post_id] =
        (likeCounts[like.post_id] ?? 0) + 1;

      if (
        user &&
        like.user_id === user.id
      ) {
        myLikes[like.post_id] = true;
      }
    });

    const voteCounts: Record<string, number> = {};
    const myVotes: Record<number, string> = {};

    (votes ?? []).forEach((vote) => {
      const optionId = String(vote.option_id);

      voteCounts[optionId] =
        (voteCounts[optionId] ?? 0) + 1;

      if (
        user &&
        vote.user_id === user.id
      ) {
        myVotes[vote.poll_id] = optionId;
      }
    });

    setLikedPosts(myLikes);
    setPollVotes(myVotes);

    setFeedItems((currentItems) =>
      currentItems.map((item) => {
        if (item.type === 'post') {
          return {
            ...item,
            likes:
              likeCounts[item.id] ?? 0,
          };
        }

        return {
          ...item,
          options: item.options.map(
            (option) => ({
              ...option,
              votes:
                voteCounts[option.id] ?? 0,
            })
          ),
        };
      })
    );
  }

  loadInteractions();
}, [feedItems.length, user]);

function promptSignIn() {
  Alert.alert(
    'Join the conversation',
    'Become a W&W Member or sign in to like posts and vote in The Den.',
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
      {
        text: 'Join W&W',
        onPress: () =>
          router.push({
            pathname: '/auth',
            params: { mode: 'signup' },
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

setFeedItems((currentItems) =>
  currentItems.map((item) => {
    if (
      item.type !== 'post' ||
      item.id !== postId
    ) {
      return item;
    }

    return {
      ...item,
      likes: Math.max(
        0,
        item.likes + (alreadyLiked ? -1 : 1)
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

  setFeedItems((currentItems) =>
  currentItems.map((item) => {
    if (
      item.type !== 'poll' ||
      item.id !== pollId
    ) {
      return item;
    }

    return {
      ...item,
      options: item.options.map((option) => {
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
<View style={styles.headerRow}>
  <View style={styles.headerText}>
    <Text style={styles.eyebrow}>
      W&W COMMUNITY
    </Text>

    <Text style={styles.title}>
      The Den
    </Text>
  </View>

  <ProfileButton />
</View>

<Text style={styles.subtitle}>
  Two fandoms. One community.
</Text>
        {!user && (
  <View style={styles.guestCard}>
    <Text style={styles.guestEyebrow}>
      W&W MEMBERS
    </Text>

    <Text style={styles.guestTitle}>
      Join the conversation
    </Text>

    <Text style={styles.guestText}>
      Become a W&W Member to like posts, vote in polls,
      make Predictor picks and join the leaderboard.
    </Text>

    <View style={styles.guestActions}>
      <Pressable
        style={styles.guestPrimaryButton}
        onPress={() =>
          router.push({
            pathname: '/auth',
            params: { mode: 'signup' },
          })
        }
      >
        <Text style={styles.guestPrimaryButtonText}>
          JOIN W&W
        </Text>
      </Pressable>

      <Pressable
        style={styles.guestSecondaryButton}
        onPress={() =>
          router.push({
            pathname: '/auth',
            params: { mode: 'login' },
          })
        }
      >
        <Text style={styles.guestSecondaryButtonText}>
          SIGN IN
        </Text>
      </Pressable>
    </View>
  </View>
)}

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
<View style={styles.denIdentity}>
  <View style={styles.denIdentityLogos}>
    {(activeFilter === 'all' || activeFilter === 'pack') && (
      <Image
        source={require('../../../assets/wookiees-and-wolves-small-wolves-image.png')}
        style={styles.denIdentityLogo}
        resizeMode="contain"
      />
    )}

    {activeFilter === 'all' && (
      <Text style={styles.denIdentityDivider}>×</Text>
    )}

    {(activeFilter === 'all' || activeFilter === 'cantina') && (
      <Image
        source={require('../../../assets/wookiees-and-wolves-small_sw_image.png')}
        style={styles.denIdentityLogo}
        resizeMode="contain"
      />
    )}
  </View>

  <Text style={styles.denIdentityLabel}>
    {activeFilter === 'pack'
      ? 'THE PACK'
      : activeFilter === 'cantina'
        ? 'THE CANTINA'
        : 'ALL OF THE DEN'}
  </Text>
</View>
<View style={styles.searchSection}>
  <TextInput
    style={styles.searchInput}
    value={searchText}
    onChangeText={setSearchText}
    placeholder="Search The Den..."
    placeholderTextColor="#60778A"
    returnKeyType="search"
    autoCorrect={false}
    onSubmitEditing={() =>
      setActiveSearch(searchText.trim())
    }
  />

  {activeSearch ? (
    <Pressable
      style={styles.clearSearchButton}
      onPress={() => {
        setSearchText('');
        setActiveSearch('');
      }}
    >
      <Text style={styles.clearSearchText}>
        CLEAR
      </Text>
    </Pressable>
  ) : (
    <Pressable
      style={styles.searchButton}
      onPress={() =>
        setActiveSearch(searchText.trim())
      }
    >
      <Text style={styles.searchButtonText}>
        SEARCH
      </Text>
    </Pressable>
  )}
</View>
<View style={styles.contentFilterSection}>
  <Text style={styles.contentFilterLabel}>
    SHOW
  </Text>

  <View style={styles.contentFilters}>
    <ContentFilterButton
      label="EVERYTHING"
      active={contentFilter === 'all'}
      onPress={() => setContentFilter('all')}
    />

    <ContentFilterButton
      label="POSTS"
      active={contentFilter === 'post'}
      onPress={() => setContentFilter('post')}
    />

    <ContentFilterButton
      label="POLLS"
      active={contentFilter === 'poll'}
      onPress={() => setContentFilter('poll')}
    />
  </View>
</View>

{/* FEED */}
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
{!feedLoading &&
  !feedError &&
  feedItems.length < totalFeedCount && (
    <Pressable
      style={[
        styles.loadMoreButton,
        loadingMore &&
          styles.loadMoreButtonDisabled,
      ]}
      disabled={loadingMore}
      onPress={() =>
        loadFeed(feedItems.length, true)
      }
    >
      <Text style={styles.loadMoreButtonText}>
        {loadingMore
          ? 'LOADING...'
          : 'LOAD MORE'}
      </Text>

      <Text style={styles.loadMoreCount}>
        {feedItems.length} of {totalFeedCount}
      </Text>
    </Pressable>
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
function ContentFilterButton({
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
        styles.contentFilterButton,
        active &&
          styles.contentFilterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.contentFilterText,
          active &&
            styles.contentFilterTextActive,
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
  category === 'pack'
    ? 'THE PACK'
    : category === 'cantina'
      ? 'THE CANTINA'
      : 'ALL OF THE DEN';

  return (
    <View style={styles.feedHeader}>
      <View style={styles.feedHeaderLeft}>
        <View
          style={[
  styles.categoryBadge,
  category === 'cantina' &&
    styles.cantinaBadge,
  category === 'both' &&
    styles.bothBadge,
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
headerRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginTop: 18,
},

headerText: {
  flex: 1,
  paddingRight: 16,
},
  eyebrow: {
    color: '#75C7F0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
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
bothBadge: {
  backgroundColor: '#24313D',
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
denIdentity: {
  alignItems: 'center',
  marginTop: -4,
  marginBottom: 22,
},

denIdentityLogos: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
},

denIdentityLogo: {
  width: 54,
  height: 54,
},

denIdentityDivider: {
  color: '#53697B',
  fontSize: 16,
  fontWeight: '700',
},

denIdentityLabel: {
  color: '#8FA2B3',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.5,
  marginTop: 7,
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
guestCard: {
  backgroundColor: '#101D2B',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 16,
  padding: 17,
  marginBottom: 20,
},

guestEyebrow: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1.4,
},

guestTitle: {
  color: '#F3EFE3',
  fontSize: 18,
  fontWeight: '900',
  marginTop: 5,
},

guestText: {
  color: '#8FA2B3',
  fontSize: 12,
  lineHeight: 18,
  marginTop: 5,
},

guestActions: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 14,
},

guestPrimaryButton: {
  flex: 1,
  backgroundColor: '#75C7F0',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
},

guestPrimaryButtonText: {
  color: '#07111F',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

guestSecondaryButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingVertical: 11,
  alignItems: 'center',
},

guestSecondaryButtonText: {
  color: '#75C7F0',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},
loadMoreButton: {
  borderWidth: 1,
  borderColor: '#31516B',
  backgroundColor: '#101D2B',
  borderRadius: 12,
  paddingVertical: 13,
  alignItems: 'center',
  marginTop: 4,
  marginBottom: 10,
},

loadMoreButtonDisabled: {
  opacity: 0.55,
},

loadMoreButtonText: {
  color: '#75C7F0',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},

loadMoreCount: {
  color: '#60778A',
  fontSize: 9,
  fontWeight: '700',
  marginTop: 3,
},
contentFilterSection: {
  marginTop: -10,
  marginBottom: 18,
},

contentFilterLabel: {
  color: '#60778A',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 1.3,
  marginBottom: 7,
},

contentFilters: {
  flexDirection: 'row',
  gap: 7,
},

contentFilterButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#263C4F',
  borderRadius: 8,
  paddingVertical: 8,
  alignItems: 'center',
},

contentFilterButtonActive: {
  backgroundColor: '#172A3C',
  borderColor: '#75C7F0',
},

contentFilterText: {
  color: '#60778A',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.7,
},

contentFilterTextActive: {
  color: '#75C7F0',
},
searchSection: {
  flexDirection: 'row',
  gap: 8,
  marginTop: -10,
  marginBottom: 18,
},

searchInput: {
  flex: 1,
  backgroundColor: '#0B1723',
  borderWidth: 1,
  borderColor: '#2A4053',
  borderRadius: 9,
  paddingHorizontal: 13,
  paddingVertical: 10,
  color: '#F3EFE3',
  fontSize: 13,
},

searchButton: {
  backgroundColor: '#172A3C',
  borderWidth: 1,
  borderColor: '#31516B',
  borderRadius: 9,
  paddingHorizontal: 13,
  justifyContent: 'center',
},

searchButtonText: {
  color: '#75C7F0',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

clearSearchButton: {
  backgroundColor: '#21181D',
  borderWidth: 1,
  borderColor: '#55383D',
  borderRadius: 9,
  paddingHorizontal: 13,
  justifyContent: 'center',
},

clearSearchText: {
  color: '#C98389',
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},
});