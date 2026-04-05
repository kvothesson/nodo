import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null); // null | 'join'
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Ingresá tu nombre'); return; }
    onCreateRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim()) { setError('Ingresá tu nombre'); return; }
    if (code.trim().length < 4) { setError('Código de 4 caracteres'); return; }
    onJoinRoom(code.trim(), name.trim());
  };

  return (
    <div className="screen lobby">
      <div className="logo">
        <h1>DUEL TAP</h1>
        <p className="tagline">Reflejos vs. Reflejos</p>
      </div>

      <div className="card">
        <label className="input-label">Tu nombre</label>
        <input
          className="input"
          placeholder="Máx. 12 caracteres"
          value={name}
          maxLength={12}
          onChange={e => { setName(e.target.value.slice(0, 12)); setError(''); }}
        />

        {error && <p className="error">{error}</p>}

        {mode === null && (
          <div className="btn-group" style={{ marginTop: '.25rem' }}>
            <button className="btn btn-primary" onClick={handleCreate}>
              Crear sala
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              Unirse a sala
            </button>
          </div>
        )}

        {mode === 'join' && (
          <>
            <label className="input-label" style={{ marginTop: '.75rem' }}>Código de sala</label>
            <input
              className="input input-code"
              placeholder="XXXX"
              value={code}
              maxLength={4}
              autoCapitalize="characters"
              onChange={e => { setCode(e.target.value.toUpperCase().slice(0, 4)); setError(''); }}
            />
            <div className="btn-group">
              <button className="btn btn-primary" onClick={handleJoin}>
                Unirse
              </button>
              <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
                Volver
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
