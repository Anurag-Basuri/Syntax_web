import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLeaders } from '../hooks/useMembers';

// Small constants
const PREVIEW_COUNT = 8;
const CARD_BG = 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))';

// helper to generate initials avatar
const initialsAvatar = (seed) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed || 'user')}&backgroundColor=transparent`;

// deterministic colored background for initials
const stringToHsl = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h} 70% 50%)`;
};

const TeamPreview = () => {
  const { data: rawLeaders, isLoading, isError, refetch } = useLeaders();
  const navigate = useNavigate();

  // parse leaders into array safely
  const leaders = useMemo(() => {
    if (!rawLeaders) return [];
    if (Array.isArray(rawLeaders)) return rawLeaders;
    if (Array.isArray(rawLeaders.members)) return rawLeaders.members;
    if (rawLeaders.data && Array.isArray(rawLeaders.data.members)) return rawLeaders.data.members;
    return [];
  }, [rawLeaders]);

  // preview slice
  const preview = useMemo(() => leaders.slice(0, PREVIEW_COUNT), [leaders]);

  // card sizing: ensure uniform heights across the preview grid
  const gridRef = useRef(null);
  const resizeTimer = useRef(null);

  const measureAndApplyHeights = () => {
    const container = gridRef.current;
    if (!container) return;
    // Find inner content element per card to measure natural height
    const inners = container.querySelectorAll('.tp-card-inner');
    if (!inners || inners.length === 0) return;
    // reset heights first
    inners.forEach((el) => {
      el.style.height = 'auto';
    });
    // measure max
    let max = 0;
    inners.forEach((el) => {
      const h = el.getBoundingClientRect().height;
      if (h > max) max = h;
    });
    // apply max height to all (plus a tiny buffer)
    const final = Math.ceil(max) + 2;
    inners.forEach((el) => {
      el.style.height = `${final}px`;
    });
  };

  useEffect(() => {
    // measure on mount and when preview changes
    measureAndApplyHeights();
    const onResize = () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => {
        measureAndApplyHeights();
      }, 120);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, [preview, isLoading]);

  const goToTeam = () => navigate('/team');

  // UI
  if (!isLoading && isError) {
    return (
      <section className="section-container py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Our Core Team</h2>
          <p className="text-sm text-muted mb-6">Unable to load leaders — check connection.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => refetch()} className="btn-outline px-4 py-2 rounded">
              Retry
            </button>
            <button onClick={goToTeam} className="btn-primary px-4 py-2 rounded text-white">
              View Full Team
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container py-12">
      <div className="max-w-7xl mx-auto px-4">
        <header className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Our Core Team</h2>
          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto">
            Meet the leadership driving Syntax — minimal details for a quick preview.
          </p>
        </header>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          aria-live="polite"
        >
          {isLoading
            ? // skeleton placeholders
              Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <div key={i} className="rounded-lg p-3">
                  <div
                    className="tp-card-inner rounded-lg p-4 flex flex-col justify-between items-center"
                    style={{
                      background: CARD_BG,
                      minHeight: 180,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                    aria-busy="true"
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-700/40 mb-4" />
                    <div className="w-28 h-4 rounded bg-slate-700/40 mb-2" />
                    <div className="w-20 h-3 rounded bg-slate-700/40" />
                  </div>
                </div>
              ))
            : preview.map((m, idx) => {
                const id = m?._id || m?.id || `leader-${idx}`;
                const name = (m?.fullname || m?.name || 'Team Member').trim();
                const role = Array.isArray(m?.designation)
                  ? m.designation[0]
                  : m?.designation || m?.role || 'Leader';

                const img = m?.profilePicture?.url || '';

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                    className="rounded-lg p-1"
                  >
                    <button
                      type="button"
                      onClick={goToTeam}
                      aria-label={`View full team — ${name}`}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      style={{ background: 'transparent', border: 0, padding: 0 }}
                    >
                      <div
                        className="tp-card-inner rounded-lg p-4 flex flex-col justify-between items-center"
                        style={{
                          background: CARD_BG,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={`${name} avatar`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = initialsAvatar(name);
                              }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/8 shadow-sm"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                              style={{ background: stringToHsl(name) }}
                            >
                              <span className="text-lg sm:text-2xl select-none">
                                {(name?.charAt(0) || '?').toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-full text-center mt-3 px-2">
                          <h3
                            className="text-sm sm:text-base font-semibold text-primary mb-1"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: '1.15rem',
                            }}
                            title={name}
                          >
                            {name}
                          </h3>
                          <p
                            className="text-xs sm:text-sm text-muted"
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={role}
                          >
                            {role}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={goToTeam}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-[1.02] transition-transform"
          >
            View Full Team
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeamPreview;
