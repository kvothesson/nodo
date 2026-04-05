export default function Countdown({ count, players }) {
  return (
    <div className="screen countdown">
      <div className="countdown-players">
        {players.map((p) => (
          <div key={p.id} className="countdown-player">
            <span className="countdown-player-name">{p.name}</span>
            <span className="countdown-player-score">0</span>
          </div>
        ))}
      </div>

      <div key={count} className="countdown-number">
        {count ?? '…'}
      </div>
    </div>
  );
}
