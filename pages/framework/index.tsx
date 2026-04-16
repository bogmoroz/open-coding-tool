import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { GetServerSideProps } from 'next';
import prisma from '../../lib/prisma';

type SnippetData = {
  text: string;
  sourceName: string;
  publicationTitle: string;
  author: string;
  year: string;
  url: string;
};

type ChildCode = {
  id: number;
  codeName: string;
  snippets: SnippetData[];
  hasChildren: boolean;
  childCount: number;
};

type PillarCode = {
  id: number;
  codeName: string;
  snippets: SnippetData[];
  children: ChildCode[];
};

type ModalState = {
  name: string;
  snippets: SnippetData[];
  cardId?: number;   // set when this item also has its own card in the grid
  childCount?: number;
};

interface Props {
  pillars: PillarCode[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  const codesWithChildren = await prisma.code.findMany({
    where: { children: { some: {} } },
    orderBy: { id: 'asc' },
    include: {
      codings: { include: { source: true } },
      children: {
        orderBy: { id: 'asc' },
        include: {
          codings: { include: { source: true } },
          children: { select: { id: true } }
        }
      }
    }
  });

  const toSnippets = (codings: any[]) =>
    codings
      .filter((c) => c.codedSnippet)
      .map((c) => ({
        text: c.codedSnippet,
        sourceName: c.source.sourceName,
        publicationTitle: c.source.publicationTitle,
        author: c.source.author,
        year: c.source.year,
        url: c.source.url
      }));

  // Build a set of IDs that have cards (i.e. have children)
  const cardIds = new Set(codesWithChildren.map((c) => c.id));

  const pillars = codesWithChildren.map((code) => ({
    id: code.id,
    codeName: code.codeName,
    snippets: toSnippets(code.codings),
    children: code.children.map((child) => ({
      id: child.id,
      codeName: child.codeName,
      snippets: toSnippets(child.codings),
      hasChildren: child.children.length > 0,
      childCount: child.children.length
    }))
  }));

  return { props: { pillars } };
};

const FrameworkPage: React.FC<Props> = ({ pillars }) => {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [showBadges, setShowBadges] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [search, setSearch] = useState('');

  const allIds = pillars.map((p) => p.id);

  const q = search.trim().toLowerCase();

  // Cards whose own name matches
  const matchedCardIds: Set<number> = q
    ? new Set(pillars.filter((p) => p.codeName.toLowerCase().includes(q)).map((p) => p.id))
    : new Set();

  // Cards that have at least one matching child (so we can flip & highlight them)
  const cardsWithMatchedChildren: Set<number> = q
    ? new Set(
        pillars
          .filter((p) => p.children.some((c) => c.codeName.toLowerCase().includes(q)))
          .map((p) => p.id)
      )
    : new Set();

  // Union — any card that has a match at any level gets highlighted
  const matchedIds = new Set([...matchedCardIds, ...cardsWithMatchedChildren]);

  // Helper to check if a specific child matches
  const childMatches = (name: string) => q && name.toLowerCase().includes(q);

  useEffect(() => {
    if (matchedIds.size === 0) return;
    // Prefer scrolling to a direct card name match first, then child matches
    const firstId = [...matchedCardIds][0] ?? [...cardsWithMatchedChildren][0];
    document.getElementById(`card-${firstId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [search]);

  const toggleFlip = (id: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealAll = () => setFlipped(new Set(allIds));
  const resetAll = () => setFlipped(new Set());

  const openModal = (state: ModalState) => {
    if (state.snippets.length === 0 && !state.cardId) return;
    setModal(state);
  };

  const goToCard = (cardId: number) => {
    setModal(null);
    setFlipped((prev) => new Set([...prev, cardId]));
    setTimeout(() => {
      document.getElementById(`card-${cardId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 50);
  };

  return (
    <Layout>
      <div className="page">
        <h1 className="title">Framework View</h1>
        <div className="controls">
          <button className="btn" onClick={revealAll}>Reveal all</button>
          <button className="btn secondary" onClick={resetAll}>Reset all</button>
          <label className="badge-toggle-label">
            <input
              type="checkbox"
              checked={showBadges}
              onChange={(e) => setShowBadges(e.target.checked)}
            />
            Show source counts
          </label>
        </div>

        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Search cards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="grid">
          {pillars.map((pillar) => {
            const isFlipped = flipped.has(pillar.id) || cardsWithMatchedChildren.has(pillar.id);
            return (
              <div key={pillar.id} id={`card-${pillar.id}`} className={`card-wrap ${matchedIds.has(pillar.id) ? 'highlighted' : ''}`}>
                {/* Back rendered first — its height drives the card-wrap height */}
                <div className={`card-back ${isFlipped ? 'visible' : ''}`}>
                  <div
                    className="pillar-title"
                    onClick={() => toggleFlip(pillar.id)}
                  >
                    {pillar.codeName}
                    {showBadges && pillar.snippets.length > 0 && (
                      <span
                        className="badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal({ name: pillar.codeName, snippets: pillar.snippets });
                        }}
                      >
                        {pillar.snippets.length}
                      </span>
                    )}
                  </div>
                  <div className="items">
                    {pillar.children.map((child) => (
                      <div
                        key={child.id}
                        className={`item ${child.snippets.length === 0 && !child.hasChildren ? 'no-data' : ''} ${child.hasChildren ? 'has-card' : ''} ${childMatches(child.codeName) ? 'item-highlighted' : ''}`}
                        onClick={() =>
                          openModal({
                            name: child.codeName,
                            snippets: child.snippets,
                            cardId: child.hasChildren ? child.id : undefined,
                            childCount: child.hasChildren ? child.childCount : undefined
                          })
                        }
                      >
                        {child.codeName}
                        {child.hasChildren && <span className="has-card-indicator">↓</span>}
                        {showBadges && child.snippets.length > 0 && (
                          <span className="badge">{child.snippets.length}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Front overlaid on top */}
                <div
                  className={`card-front ${isFlipped ? '' : 'visible'}`}
                  onClick={() => toggleFlip(pillar.id)}
                >
                  <div className="front-title">{pillar.codeName}</div>
                </div>
              </div>
            );
          })}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">{modal.name}</div>
                  <div className="modal-meta">
                    {modal.snippets.length > 0 && (
                      <span>
                        {modal.snippets.length} coded snippet{modal.snippets.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {modal.snippets.length > 0 && modal.cardId && (
                      <span className="modal-meta-sep"> · </span>
                    )}
                    {modal.cardId && (
                      <button
                        className="modal-card-link"
                        onClick={() => goToCard(modal.cardId!)}
                      >
                        {modal.childCount} sub-code{modal.childCount !== 1 ? 's' : ''} →
                      </button>
                    )}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setModal(null)}>
                  ×
                </button>
              </div>
              {modal.snippets.length > 0 && (
                <div className="modal-body">
                  {modal.snippets.map((s, i) => (
                    <div key={i} className="snippet-card">
                      <div className="snippet-source">
                        <span className="snippet-source-name">{s.sourceName}</span>
                        {s.publicationTitle && (
                          <span className="snippet-source-title">{s.publicationTitle}</span>
                        )}
                        {(s.author || s.year) && (
                          <span className="snippet-source-year">
                            · {[s.author, s.year].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {s.url && (
                          <a
                            className="snippet-source-link"
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ↗ open
                          </a>
                        )}
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: s.text }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          .page {
            padding: 24px 32px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }
          .title {
            color: #0d1b2a;
            font-size: 22px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 16px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 14px;
            width: 100%;
            margin-top: 16px;
          }

          .card-wrap {
            position: relative;
          }

          .card-back {
            border-radius: 6px;
            border: 1.5px solid #d0dce8;
            border-top: 3px solid #2196f3;
            padding: 14px;
            background: #ffffff;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.25s, visibility 0.25s;
            pointer-events: none;
          }
          .card-back.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          .card-front {
            position: absolute;
            inset: 0;
            border-radius: 6px;
            border: 1.5px solid #d0dce8;
            border-top: 3px solid #2196f3;
            padding: 14px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.25s, visibility 0.25s;
            pointer-events: none;
          }
          .card-front.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }
          .card-front.visible:hover .front-title {
            color: #2196f3;
          }

          .front-title {
            color: #0d1b2a;
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-align: center;
            transition: color 0.15s;
          }

          .pillar-title {
            color: #0d1b2a;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1.5px solid #d0dce8;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .pillar-title:hover {
            color: #2196f3;
          }

          .items {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .item {
            background: #f0f5fa;
            border: 1px solid #d0dce8;
            border-radius: 4px;
            padding: 6px 8px;
            color: #1a2e40;
            font-size: 11.5px;
            line-height: 1.35;
            text-align: center;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
          .item:hover {
            border-color: #2196f3;
            background: #e3f2fd;
            color: #0d1b2a;
          }
          .item.no-data {
            opacity: 0.6;
            cursor: default;
          }
          .item.no-data:hover {
            border-color: #d0dce8;
            background: #f0f5fa;
            color: #1a2e40;
          }
          .item.has-card {
            border-style: dashed;
            font-style: italic;
          }
          .has-card-indicator {
            font-size: 9px;
            color: #2196f3;
            font-style: normal;
          }

          .badge {
            background: #2196f3;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            border-radius: 8px;
            padding: 1px 5px;
            line-height: 1.4;
            letter-spacing: 0;
            text-transform: none;
          }

          /* Controls */
          .controls {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .btn {
            background: #0d1b2a;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 10px 24px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .btn:hover {
            background: #2196f3;
          }
          .btn.secondary {
            background: #ffffff;
            color: #0d1b2a;
            border: 1.5px solid #d0dce8;
          }
          .btn.secondary:hover {
            border-color: #2196f3;
            color: #2196f3;
            background: #ffffff;
          }
          .badge-toggle-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #8a9baa;
            cursor: pointer;
            user-select: none;
            margin-left: 4px;
          }
          .search-wrap {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 500;
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 1.5px solid #d0dce8;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(13, 27, 42, 0.12);
            padding: 2px 4px 2px 2px;
          }
          .search-input {
            border: none;
            border-radius: 6px;
            padding: 8px 8px 8px 12px;
            font-size: 13px;
            color: #0d1b2a;
            outline: none;
            width: 200px;
            background: transparent;
          }
          .search-clear {
            background: none;
            border: none;
            color: #8a9baa;
            font-size: 16px;
            cursor: pointer;
            line-height: 1;
            padding: 0 4px;
          }
          .search-clear:hover {
            color: #0d1b2a;
          }
          .card-wrap.highlighted .card-front,
          .card-wrap.highlighted .card-back {
            border-color: #2196f3;
            border-width: 2px;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
          }
          .item.item-highlighted {
            background: #e3f2fd;
            border-color: #2196f3;
            border-width: 2px;
            color: #0d1b2a;
            font-weight: 700;
          }

          /* Modal */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(13, 27, 42, 0.55);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .modal {
            background: #ffffff;
            border-radius: 10px;
            width: 640px;
            max-width: 95vw;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 40px rgba(13, 27, 42, 0.18);
          }
          .modal-header {
            padding: 18px 20px 14px;
            border-bottom: 1.5px solid #d0dce8;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }
          .modal-title {
            color: #0d1b2a;
            font-size: 15px;
            font-weight: 700;
          }
          .modal-meta {
            color: #2196f3;
            font-size: 11px;
            font-weight: 700;
            margin-top: 3px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .modal-meta-sep {
            color: #d0dce8;
          }
          .modal-card-link {
            background: none;
            border: none;
            color: #2196f3;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            padding: 0;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .modal-card-link:hover {
            color: #0d1b2a;
          }
          .modal-close {
            background: none;
            border: none;
            color: #8a9baa;
            font-size: 20px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
          }
          .modal-close:hover {
            color: #0d1b2a;
          }
          .modal-body {
            overflow-y: auto;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .snippet-card {
            background: #f0f5fa;
            border: 1px solid #d0dce8;
            border-left: 3px solid #2196f3;
            border-radius: 4px;
            padding: 10px 12px;
            color: #1a2e40;
            font-size: 12.5px;
            line-height: 1.6;
          }
          .snippet-source {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-bottom: 6px;
            flex-wrap: wrap;
          }
          .snippet-source-name {
            color: #2196f3;
            font-size: 10.5px;
            font-weight: 700;
          }
          .snippet-source-title {
            color: #5a7a8a;
            font-size: 10.5px;
            font-style: italic;
          }
          .snippet-source-year {
            color: #8a9baa;
            font-size: 10px;
          }
          .snippet-source-link {
            color: #2196f3;
            font-size: 10px;
            text-decoration: none;
            margin-left: auto;
          }
          .snippet-source-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default FrameworkPage;
