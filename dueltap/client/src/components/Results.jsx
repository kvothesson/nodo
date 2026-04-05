export default function Results({ results, playerId, isHost, onRematch, onExit }) {
  if (!results) return null;

  const { scores, stats, winner, forfeit } = results;
  const me  = scores.find(s => s.id === playerId);
  const opp = scores.find(s => s.id !== playerId);
  const myStats  = stats?.[playerId];
  const oppStats = stats?.[opp?.id];

  const iWon = winner === playerId;
  const isTie = winner === 'tie';
  const bannerClass = isTie ? 'tie' : iWon ? 'winner' : 'loser';
  const bannerText  = forfeit
    ? 'Oponente abandonó'
    : isTie ? '¡Empate!'
    : iWon  ? '¡Ganaste! 🎉'
    : 'Perdiste';

  return (
    <div className="screen results">
      <div className={`winner-banner ${bannerClass}`}>{bannerText}</div>

      <div className="final-scores">
        <div className={`final-score${iWon ? ' highlighted' : ''}`}>
          <span className="score-name">{me?.name ?? 'Vos'}</span>
          <span className="score-val-big">{me?.score ?? 0}</span>
        </div>
        <span className="score-divider">vs</span>
        <div className={`final-score${!iWon && !isTie ? ' highlighted' : ''}`}>
          <span className="score-name">{opp?.name ?? '—'}</span>
          <span className="score-val-big">{opp?.score ?? 0}</span>
        </div>
      </div>

      {myStats && oppStats && (
        <div className="stats-table">
          <div className="stats-head">
            <span>{me?.name}</span>
            <span>Stats</span>
            <span>{opp?.name}</span>
          </div>
          <StatRow mine={fmt(myStats.avgReaction, 'ms')} label="Reacción prom." theirs={fmt(oppStats.avgReaction, 'ms')} />
          <StatRow mine={fmt(myStats.fastest, 'ms')}     label="Más rápido"     theirs={fmt(oppStats.fastest, 'ms')} />
          <StatRow mine={String(myStats.correct)}         label="Correctas"      theirs={String(oppStats.correct)} />
          <StatRow mine={String(myStats.incorrect)}       label="Incorrectas"    theirs={String(oppStats.incorrect)} />
        </div>
      )}

      <div className="btn-group">
        {isHost && (
          <button className="btn btn-primary btn-large" onClick={onRematch}>
            Revancha
          </button>
        )}
        {!isHost && (
          <p className="waiting-host">Esperando que el host inicie la revancha…</p>
        )}
        <button className="btn btn-secondary" onClick={onExit}>
          Salir
        </button>
      </div>
    </div>
  );
}

function StatRow({ mine, label, theirs }) {
  return (
    <div className="stat-row">
      <span className="stat-mine">{mine}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-theirs">{theirs}</span>
    </div>
  );
}

function fmt(val, unit) {
  return val != null ? `${val}${unit}` : '—';
}
