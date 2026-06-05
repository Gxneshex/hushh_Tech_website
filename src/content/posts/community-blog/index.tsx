import React from 'react';
import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import HushhAiLogoImg from '../../../components/images/blog2o.png';
import { communityBlogPosts, type CommunityBlogPost } from '../../../data/communityBlogPosts';
import type { PostData } from '../../../data/posts';

// Public-safe community blog posts (markets, funds, AI, business). Each post renders its
// markdown body followed by a References section (reference images + external links).
// The post title is rendered by the community detail page, so the body carries no H1.

const CATEGORY: Record<string, string> = {
  funds: 'fund updates',
  general: 'general',
  market: 'market updates',
  'investor-relations': 'investor relations & strategies',
  insights: 'investment & financial strategies',
  product: 'product updates',
};

const richSx = {
  '& img': { maxWidth: '100%', borderRadius: '16px', margin: '10px 0' },
  '& h2': { fontSize: '24px', fontWeight: 700, margin: '22px 0 8px' },
  '& h3': { fontSize: '19px', fontWeight: 700, margin: '16px 0 6px' },
  '& p': { fontSize: '17px', lineHeight: 1.7, margin: '0 0 16px' },
  '& li': { fontSize: '17px', lineHeight: 1.6, marginBottom: '6px' },
  '& ul,& ol': { paddingLeft: '22px', marginBottom: '16px' },
  '& blockquote': { borderLeft: '3px solid #0066CC', background: '#F5F5F7', padding: '10px 16px', borderRadius: '8px', margin: '0 0 16px', color: '#3a3a3c' },
  '& a': { color: '#0066CC', fontWeight: 500 },
  '& strong': { fontWeight: 700 },
} as const;

const hideOnError: React.ReactEventHandler<HTMLImageElement> = (e) => { e.currentTarget.style.display = 'none'; };

function References({ refs }: { refs: CommunityBlogPost['references'] }) {
  if (!refs.length) return null;
  const images = refs.filter((r) => r.type === 'image');
  const links = refs.filter((r) => r.type === 'link');
  return (
    <Box mt={8} pt={5} borderTop="1px solid #ececec">
      <Box fontSize="13px" fontWeight={700} color="#6e6e73" textTransform="uppercase" letterSpacing="0.05em" mb={3}>
        References
      </Box>
      {images.map((r, i) => (
        <img
          key={`img-${i}`}
          src={r.url}
          alt={r.label}
          loading="lazy"
          onError={hideOnError}
          style={{ maxWidth: '100%', borderRadius: 12, margin: '8px 0', border: '1px solid #ececec' }}
        />
      ))}
      {links.length > 0 && (
        <Box as="ul" pl="20px" mt={images.length ? 4 : 0}>
          {links.map((r, i) => (
            <Box as="li" key={`lnk-${i}`} mb={2} fontSize="16px" lineHeight={1.5}>
              <a href={r.url} target="_blank" rel="noreferrer noopener" style={{ color: '#0066CC', fontWeight: 500, wordBreak: 'break-word' }}>
                {r.label}
              </a>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function BlogPost({ post }: { post: CommunityBlogPost }) {
  return (
    <Box color="#1d1d1f" sx={richSx}>
      <ReactMarkdown>{post.body}</ReactMarkdown>
      <References refs={post.references} />
    </Box>
  );
}

export const communityBlogPostList: PostData[] = communityBlogPosts.map((p, i) => ({
  count: 300 + i,
  slug: p.slug,
  title: p.title,
  publishedAt: p.publishedAt || '2026-06-04',
  description: p.description,
  category: CATEGORY[p.category] || 'general',
  Component: () => <BlogPost post={p} />,
  image: HushhAiLogoImg,
  accessLevel: 'Public',
}));

export default communityBlogPostList;
