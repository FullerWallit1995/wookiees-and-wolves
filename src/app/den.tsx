import { useMemo, useState } from 'react';
import {
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

const feed: FeedItem[] = [
  {
    id: 1,
    type: 'post',
    category: 'pack',
    text: 'Are the Wolves a 50-win team this season?',
    likes: 24,
    time: '2h',
  },
  {
    id: 2,
    type: 'poll',
    category: 'cantina',
    question: 'Which Star Wars era should the next movie explore?',
    options: [
      {
        id: 'old-republic',
        text: 'Old Republic',
        votes: 52,
      },
      {
        id: 'high-republic',
        text: 'High Republic',
        votes: 15,
      },
      {
        id: 'post-ix',
        text: 'Post-Episode IX',
        votes: 44,
      },
      {
        id: 'other',
        text: 'Other',
        votes: 16,
      },
    ],
    time: '5h',
  },
  {
    id: 3,
    type: 'post',
    category: 'pack',
    text: 'New episode is live. We might have been a little too nice to Rudy...',
    likes: 18,
    time: '8h',
  },
  {
    id: 4,
    type: 'poll',
    category: 'pack',
    question: 'How many games will the Wolves win this season?',
    options: [
      {
        id: 'under-45',
        text: 'Under 45',
        votes: 8,
      },
      {
        id: '45-49',
        text: '45–49',
        votes: 21,
      },
      {
        id: '50-54',
        text: '50–54',
        votes: 39,
      },
      {
        id: '55-plus',
        text: '55+',
        votes: 17,
      },
    ],
    time: '1d',
  },
];

export default function DenScreen() {
  const [activeFilter, setActiveFilter] =
    useState<Filter>('all');

  const [likedPosts, setLikedPosts] =
    useState<Record<number, boolean>>({});

  const [pollVotes, setPollVotes] =
    useState<Record<number, string>>({});

  const visibleFeed = useMemo(() => {
    if (activeFilter === 'all') {
      return feed;
    }

    return feed.filter(
      (item) => item.category === activeFilter
    );
  }, [activeFilter]);

  function toggleLike(postId: number) {
    setLikedPosts((current) => ({
      ...current,
      [postId]: !current[postId],
    }));
  }

  function vote(pollId: number, optionId: string) {
    setPollVotes((current) => ({
      ...current,
      [pollId]: optionId,
    }));
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
        {visibleFeed.map((item) => {
          if (item.type === 'post') {
            const liked = !!likedPosts[item.id];

            return (
              <View key={item.id} style={styles.card}>
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
                      {item.likes + (liked ? 1 : 0)}
                    </Text>
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
            ) + (selectedOption ? 1 : 0);

          return (
            <View key={item.id} style={styles.card}>
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

                  const displayVotes =
                    option.votes + (selected ? 1 : 0);

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
                      onPress={() =>
                        vote(item.id, option.id)
                      }
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
        })}
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

        {poll && (
          <View style={styles.pollBadge}>
            <Text style={styles.pollBadgeText}>
              POLL
            </Text>
          </View>
        )}
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

  voteCount: {
    color: '#60778A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
  },
});