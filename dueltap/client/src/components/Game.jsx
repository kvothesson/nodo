import { useState, useEffect, useRef, useCallback } from 'react';

const CONFIGS = {
  GO:     { bg: '#22c55e', color: '#ffffff', label: '¡YA!'  },
  STOP:   { bg: '#ef4444', color: '#ffffff', label: 'NO'    },
  DOUBLE: { bg: '#eab308', color: '#000000', label: '2×'    },
  RIVAL:  { bg: '#1a1a1a', color: '#ffffff', label: 'RIVAL' },
  neutral:{ bg: '#e5e7eb', color: '#9ca3af', label: ''      },
};

export default function Game({ signal, signalResult, scores, progress, playerId, onTap, disconnected }) {
  const [banner, setBanner]           = useState(null);   // { text, ok }
  const [shaking, setShaking]         = useState(false);
  const [doubleTaps, setDoubleTaps]   = useState(0);
  const flashBg                       = useRef(null);
  const bannerTimer                   = useRef(null);

  // Resetear estado al llegar nueva señal
  useEffect(() => {
    setDoubleTaps(0);
    flashBg.current = null;
  }, [signal?.signalId]);

  // Procesar resultado de señal
  useEffect(() => {
    if (!signalResult) return;

    const myChange = signalResult.pointChanges?.[playerId] ?? 0;
    clearTimeout(bannerTimer.current);

    if (myChange > 0) {
      setBanner({ text: `+${myChange}`, ok: true });
    } else if (myChange < 0) {
      setBanner({ text: `${myChange}`, ok: false });
      setShaking(true);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      setTimeout(() => setShaking(false), 400);
    } else {
      setBanner(null);
    }

    bannerTimer.current = setTimeout(() => setBanner(null), 850);
  }, [signalResult, playerId]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (!signal) return;

    if (signal.type === 'DOUBLE') {
      const next = doubleTaps + 1;
      setDoubleTaps(next);
      onTap(signal.signalId, next);
    } else {
      onTap(signal.signalId, 1);
    }
  }, [signal, doubleTaps, onTap]);

  const active  = !!signal;
  const cfg     = active ? (CONFIGS[signal.type] ?? CONFIGS.neutral) : CONFIGS.neutral;
  const myScore = scores.find(s => s.id === playerId);
  const oppScore= scores.find(s => s.id !== playerId);

  // Label personalizado para RIVAL
  let tapLabel = cfg.label;
  if (active && signal.type === 'RIVAL') {
    tapLabel = signal.isRival ? '¡TOCÁ!' : 'NO TOQUES';
  }

  return (
    <div className="game screen">
      {/* Header ─────────────────────────────────────────────────────────── */}
      <div className="game-header">
        <div className="score-box mine">
          <span className="score-name">{myScore?.name ?? 'Vos'}</span>
          <span className="score-val">{myScore?.score ?? 0}</span>
        </div>

        <span className="signal-counter">
          {progress.index + 1} / {progress.total}
        </span>

        <div className="score-box opponent">
          <span className="score-name">{oppScore?.name ?? '—'}</span>
          <span className="score-val">{oppScore?.score ?? 0}</span>
        </div>
      </div>

      {/* Tap zone ───────────────────────────────────────────────────────── */}
      <div
        className={`tap-zone${shaking ? ' shake' : ''}`}
        style={{ backgroundColor: cfg.bg }}
        onPointerDown={handlePointerDown}
      >
        {disconnected && (
          <p className="disconnect-notice">
            Oponente desconectado…<br />Esperando reconexión (10 s)
          </p>
        )}

        {!disconnected && active && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <span className="signal-label" style={{ color: cfg.color }}>
              {tapLabel}
            </span>

            {signal.type === 'RIVAL' && signal.isRival && (
              <span className="signal-subtitle" style={{ color: cfg.color }}>
                ¡Sé el primero!
              </span>
            )}

            {signal.type === 'DOUBLE' && (
              <div className="double-dots">
                <span className={doubleTaps >= 1 ? 'hit' : ''} />
                <span className={doubleTaps >= 2 ? 'hit' : ''} />
              </div>
            )}
          </div>
        )}

        {!disconnected && !active && (
          <span className="tap-hint">Preparate…</span>
        )}

        {banner && (
          <div className="result-banner" style={{ color: banner.ok ? '#fff' : '#fee2e2' }}>
            {banner.text}
          </div>
        )}
      </div>
    </div>
  );
}
