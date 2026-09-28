import { XMLParser } from 'fast-xml-parser';
import { useEffect, useState } from 'react';

export type Episode = {
  id: string;
  title: string;
  date: string;
  duration?: string;
  image?: string;
  audioUrl?: string;
  youtube?: string;
  spotify?: string;
};

const RSS_URL =
  'https://anchor.fm/s/11561f8bc/podcast/rss';

const EPISODE_LINKS_URL =
  'https://raw.githubusercontent.com/FullerWallit1995/wookiees-and-wolves/main/src/data/episode-links.json';

export function useEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadEpisodes() {
      try {
        setLoading(true);
        setError(false);

        const responses = await Promise.all([
          fetch(RSS_URL),
          fetch(EPISODE_LINKS_URL),
        ]);

        const rssResponse = responses[0];
        const linksResponse = responses[1];

        if (!rssResponse.ok) {
          throw new Error('Could not load RSS feed');
        }

        if (!linksResponse.ok) {
          throw new Error('Could not load episode links');
        }

        const xml = await rssResponse.text();
        const episodeLinks = await linksResponse.json();

        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });

        const parsedFeed = parser.parse(xml);

        const items =
          parsedFeed?.rss?.channel?.item ?? [];

        const episodeItems = Array.isArray(items)
          ? items
          : [items];

        const formattedEpisodes: Episode[] =
          episodeItems.map((item: any, index: number) => {
            const title =
              item.title ?? 'Untitled Episode';

            const links = episodeLinks.episodes.find(
              (episode: {
                match: string;
                youtube: string;
                spotify: string;
              }) =>
                title
                  .toLowerCase()
                  .includes(
                    episode.match.toLowerCase()
                  )
            );

            return {
              id:
                item.guid?.['#text'] ??
                item.guid ??
                String(index),

              title,

              date: item.pubDate
                ? new Date(
                    item.pubDate
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '',

              duration:
                item['itunes:duration'] ?? '',

              image:
                item['itunes:image']?.['@_href'] ??
                '',

              audioUrl:
                item.enclosure?.['@_url'] ?? '',

              youtube: links?.youtube,
              spotify: links?.spotify,
            };
          });
        setEpisodes(formattedEpisodes);
      } catch (err) {
        console.log('Could not load episodes:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadEpisodes();
  }, []);

  return {
    episodes,
    latestEpisode: episodes[0],
    loading,
    error,
  };
}