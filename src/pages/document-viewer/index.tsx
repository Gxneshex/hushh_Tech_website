import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { unzipSync, strFromU8 } from 'fflate';
import {
  FileDown,
  FileSearch2,
  FileText,
  Table2,
} from 'lucide-react';
import HushhTechHeader from '../../components/hushh-tech-header/HushhTechHeader';
import {
  AppleLineIcon,
  AppleSection,
  Display,
  Eyebrow,
  Lede,
  SmallSpinner,
  appleFont,
} from '../../components/hushh-tech-ui/HushhAppleUI';

type DocumentBlock =
  | { type: 'heading'; text: string }
  | { type: 'list-item'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] };

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function getWordAttr(node: Element, localName: string): string {
  return (
    node.getAttributeNS(WORD_NS, localName) ||
    node.getAttribute(`w:${localName}`) ||
    node.getAttribute(localName) ||
    ''
  );
}

function extractParagraphText(node: Element): string {
  let text = '';

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    const localName = element.localName;

    if (localName === 't') {
      text += element.textContent || '';
      continue;
    }

    if (localName === 'tab') {
      text += '\t';
      continue;
    }

    if (localName === 'br' || localName === 'cr') {
      text += '\n';
      continue;
    }

    text += extractParagraphText(element);
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function parseDocxDocument(xml: string): DocumentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const body = doc.getElementsByTagNameNS(WORD_NS, 'body')[0];

  if (!body) {
    return [];
  }

  const blocks: DocumentBlock[] = [];

  for (const child of Array.from(body.children)) {
    if (child.localName === 'p') {
      const text = extractParagraphText(child);
      if (!text) {
        continue;
      }

      const paragraphStyle = child.getElementsByTagNameNS(WORD_NS, 'pStyle')[0];
      const styleId = paragraphStyle ? getWordAttr(paragraphStyle, 'val') : '';
      const isListItem = child.getElementsByTagNameNS(WORD_NS, 'numPr').length > 0;
      const isHeading =
        /^Heading/i.test(styleId) ||
        /^Title/i.test(styleId) ||
        /^Subtitle/i.test(styleId);

      if (isHeading) {
        blocks.push({ type: 'heading', text });
        continue;
      }

      if (isListItem) {
        blocks.push({ type: 'list-item', text });
        continue;
      }

      blocks.push({ type: 'paragraph', text });
      continue;
    }

    if (child.localName === 'tbl') {
      const rows = Array.from(child.children)
        .filter((row) => row.localName === 'tr')
        .map((row) =>
          Array.from(row.children)
            .filter((cell) => cell.localName === 'tc')
            .map((cell) => {
              const parts = Array.from(cell.children)
                .filter((cellChild) => cellChild.localName === 'p')
                .map((paragraph) => extractParagraphText(paragraph))
                .filter(Boolean);

              return parts.join('\n');
            })
        )
        .filter((row) => row.some(Boolean));

      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
      }
    }
  }

  return blocks;
}

const DocumentViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const documentUrl = searchParams.get('src') || '';
  const title = searchParams.get('title') || 'Fund Document';

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      if (!documentUrl) {
        setError('Missing document URL.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const files = unzipSync(new Uint8Array(buffer));
        const documentFile = files['word/document.xml'];

        if (!documentFile) {
          throw new Error('Unsupported document format.');
        }

        const parsedBlocks = parseDocxDocument(strFromU8(documentFile));

        if (!cancelled) {
          setBlocks(parsedBlocks);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to open document.');
          setIsLoading(false);
        }
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentUrl]);

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader />
      <main>
        <AppleSection tone="light" pad="tight">
          <div className="mx-auto mb-6 flex justify-center px-6">
            <AppleLineIcon icon={FileSearch2} size={64} iconSize={30} />
          </div>
          <Eyebrow>Document Reader</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[760px]">
            {title}
          </Display>
          <Lede>
            Review the source document in a focused reader before signing.
          </Lede>
          {documentUrl ? (
            <div className="mt-7 flex justify-center px-5">
              <a
                href={documentUrl}
                download
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1D1D1F] px-4 text-[14px] font-medium text-[#FFFFFF] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
              >
                <FileDown aria-hidden="true" size={15} strokeWidth={1.65} />
                Download Original
              </a>
            </div>
          ) : null}
        </AppleSection>

        <section className="mx-auto max-w-[900px] px-5 pb-20">
          <article className="overflow-hidden rounded-[18px] bg-[#FFFFFF] p-5 shadow-[0_0_0_0.5px_rgba(29,29,31,0.08),0_18px_44px_rgba(29,29,31,0.06)] md:p-7">
            {isLoading ? (
              <div
                className="flex min-h-[240px] items-center justify-center"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <SmallSpinner label="Loading document..." />
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-[14px] font-light leading-[1.45] text-[#1D1D1F]/68 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
              >
                {error}
              </div>
            ) : (
              <div className="space-y-5">
                {blocks.map((block, index) => {
                  if (block.type === 'heading') {
                    return (
                      <div key={`${block.type}-${index}`} className="flex gap-3 pt-2">
                        <AppleLineIcon icon={FileText} size={32} iconSize={16} className="mt-0.5" />
                        <h2 className="min-w-0 text-[21px] font-medium leading-[1.12] tracking-[-0.022em] text-[#1D1D1F]">
                          {block.text}
                        </h2>
                      </div>
                    );
                  }

                  if (block.type === 'list-item') {
                    return (
                      <p key={`${block.type}-${index}`} className="flex gap-2.5 text-[15px] font-light leading-[1.65] text-[#1D1D1F]/64">
                        <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E6E73]/55" aria-hidden="true" />
                        <span className="min-w-0 whitespace-pre-wrap">{block.text}</span>
                      </p>
                    );
                  }

                  if (block.type === 'table') {
                    return (
                      <div key={`${block.type}-${index}`} className="overflow-hidden rounded-[14px] bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                        <div className="flex items-center gap-2 border-b border-[#1D1D1F]/[0.08] px-4 py-3 text-[11px] font-medium uppercase tracking-[1.4px] text-[#1D1D1F]/56">
                          <Table2 aria-hidden="true" size={15} strokeWidth={1.65} className="text-[#6E6E73]" />
                          Table
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-[13px]">
                            <tbody className="divide-y divide-[#1D1D1F]/[0.08]">
                              {block.rows.map((row, rowIndex) => (
                                <tr key={`row-${rowIndex}`} className="align-top">
                                  {row.map((cell, cellIndex) => (
                                    <td key={`cell-${rowIndex}-${cellIndex}`} className="whitespace-pre-wrap px-4 py-3 font-light leading-[1.5] text-[#1D1D1F]/66">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p key={`${block.type}-${index}`} className="whitespace-pre-wrap text-[15px] font-light leading-[1.7] text-[#1D1D1F]/66">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
};

export default DocumentViewerPage;
