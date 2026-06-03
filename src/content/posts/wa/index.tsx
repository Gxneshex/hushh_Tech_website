import React from 'react';
import { Box } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import HushhAiLogoImg from '../../../components/images/blog2o.png';
import { whatsappCommunityPosts, type WhatsappCommunityPost } from '../../../data/whatsappCommunityPosts';
import type { PostData } from '../../../data/posts';

// Real community-blog posts sourced from WhatsApp (public-safe subset). Each post's
// Component renders its cover + markdown body + real attachments. These appear in
// /community exactly like native posts (accessLevel Public, no gate).

const CATEGORY: Record<string, string> = {
  funds: 'fund updates',
  general: 'general',
  market: 'market updates',
  'investors-faq': 'investor relations & strategies',
  nda: 'investment & financial strategies',
  product: 'product updates',
};
const isImg = (t: string) => ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(t);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

const richSx = {
  '& img': { maxWidth: '100%', borderRadius: '16px', margin: '10px 0' },
  '& h1': { fontSize: '30px', fontWeight: 800, margin: '18px 0 10px' },
  '& h2': { fontSize: '24px', fontWeight: 700, margin: '22px 0 8px' },
  '& h3': { fontSize: '19px', fontWeight: 700, margin: '16px 0 6px' },
  '& p': { fontSize: '17px', lineHeight: 1.7, margin: '0 0 16px' },
  '& li': { fontSize: '17px', lineHeight: 1.6, marginBottom: '6px' },
  '& ul,& ol': { paddingLeft: '22px', marginBottom: '16px' },
  '& blockquote': { borderLeft: '3px solid #0066CC', background: '#F5F5F7', padding: '10px 16px', borderRadius: '8px', margin: '0 0 16px', color: '#3a3a3c' },
  '& a': { color: '#0066CC', fontWeight: 500 },
  '& strong': { fontWeight: 700 },
} as const;

function Attachment({ a }: { a: WhatsappCommunityPost['attachments'][number] }) {
  if (isImg(a.type)) return <img src={a.url} alt={a.name} style={{ maxWidth: '100%', borderRadius: 12, margin: '8px 0' }} />;
  if (a.type === 'mp4' || a.type === 'mov') return <video src={a.url} controls style={{ maxWidth: '100%', borderRadius: 12, margin: '8px 0' }} />;
  if (['opus', 'ogg', 'mp3', 'm4a'].includes(a.type)) return <audio src={a.url} controls style={{ width: '100%', margin: '8px 0' }} />;
  if (a.type === 'pdf') return (
    <Box my={2}>
      <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#0066CC', fontWeight: 600 }}>Open PDF - {a.name}</a>
      <iframe title={a.name} src={`${a.url}#view=FitH`} style={{ width: '100%', height: 520, border: '1px solid #e5e5ea', borderRadius: 12, marginTop: 8 }} />
    </Box>
  );
  return <Box my={1}><a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#0066CC', fontWeight: 600 }}>{a.name} ({a.type})</a></Box>;
}

function WaPost({ post }: { post: WhatsappCommunityPost }) {
  return (
    <Box color="#1d1d1f" sx={richSx}>
      {post.coverUrl && <img src={post.coverUrl} alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 18 }} />}
      <ReactMarkdown>{post.body}</ReactMarkdown>
      {post.attachments.length > 0 && (
        <Box mt={6} pt={4} borderTop="1px solid #ececec">
          <Box fontSize="16px" fontWeight={700} mb={2}>Attachments</Box>
          {post.attachments.map((a, i) => <Attachment key={i} a={a} />)}
        </Box>
      )}
    </Box>
  );
}

export const waPosts: PostData[] = whatsappCommunityPosts.map((p, i) => ({
  count: 300 + i,
  slug: `wa/${slugify(p.title) || `post-${i}`}`,
  title: p.title,
  publishedAt: p.source.ts ? p.source.ts.slice(0, 10) : '2026-06-04',
  description: p.description,
  category: CATEGORY[p.category] || 'general',
  Component: () => <WaPost post={p} />,
  image: HushhAiLogoImg,
  accessLevel: 'Public',
}));

export default waPosts;
