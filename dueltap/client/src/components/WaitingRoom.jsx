export default function WaitingRoom({ roomCode, players, isHost, onStart }) {
  const canStart = players.length === 2;

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  };

  return (
    <div className="screen waiting">
      <h2>Sala de espera</h2>

      <div className="room-code-display" onClick={copyCode}>
        <span className="room-code-label">Código de sala</span>
        <span className="room-code">{roomCode}</span>
        <span className="room-code-hint">Toca para copiar</span>
      </div>

      <div className="players-list">
        {players.map((p, i) => (
          <div key={p.id} className="player-item">
            <span className="player-number">{i + 1}</span>
            <span className="player-name">{p.name}</span>
            {i === 0 && <span className="host-badge">Host</span>}
          </div>
        ))}
        {players.length < 2 && (
          <div className="player-item empty">
            <span className="player-number">2</span>
            <span className="player-name muted">Esperando oponente…</span>
          </div>
        )}
      </div>

      {isHost ? (
        <div className="btn-group">
          <button
            className={`btn btn-primary btn-large ${!canStart ? 'disabled' : ''}`}
            onClick={canStart ? onStart : undefined}
            disabled={!canStart}
          >
            {canStart ? '¡Iniciar partida!' : 'Esperando al oponente…'}
          </button>
        </div>
      ) : (
        <p className="waiting-host">
          {canStart ? '¡Listo! Esperando que el host inicie…' : 'Esperando oponente…'}
        </p>
      )}
    </div>
  );
}
