import { useState, useEffect, useCallback } from 'react';
import { socket, startRttMeasurement, stopRttMeasurement } from './socket';
import Lobby       from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Countdown   from './components/Countdown';
import Game        from './components/Game';
import Results     from './components/Results';

export default function App() {
  const [screen,        setScreen]        = useState('lobby');
  const [roomCode,      setRoomCode]      = useState('');
  const [isHost,        setIsHost]        = useState(false);
  const [players,       setPlayers]       = useState([]);
  const [countdown,     setCountdown]     = useState(null);
  const [signal,        setSignal]        = useState(null);
  const [signalResult,  setSignalResult]  = useState(null);
  const [scores,        setScores]        = useState([]);
  const [progress,      setProgress]      = useState({ index: 0, total: 10 });
  const [results,       setResults]       = useState(null);
  const [disconnected,  setDisconnected]  = useState(false);
  const [playerId,      setPlayerId]      = useState('');

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setPlayerId(socket.id));

    socket.on('room_state', ({ players, status }) => {
      setPlayers(players);
      if (status === 'waiting') {
        setScreen('waiting');
        setSignal(null);
        setSignalResult(null);
        setResults(null);
        setDisconnected(false);
      }
    });

    socket.on('countdown', ({ count }) => {
      setCountdown(count);
      setScreen('countdown');
    });

    socket.on('signal', (data) => {
      setScreen('game');
      setSignal(data);
      setSignalResult(null);
      setScores(data.scores);
      setProgress({ index: data.signalIndex, total: data.totalSignals });
    });

    socket.on('signal_clear', () => {
      setSignal(null);
      setSignalResult(null);
    });

    socket.on('signal_result', (result) => {
      setSignalResult(result);
      setScores(result.scores);
    });

    socket.on('game_over', (data) => {
      setResults(data);
      setScreen('results');
      stopRttMeasurement();
    });

    socket.on('opponent_disconnected', () => {
      setDisconnected(true);
      setTimeout(() => setDisconnected(false), 10500);
    });

    return () => {
      stopRttMeasurement();
      socket.offAny();
      socket.disconnect();
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback((name) => {
    socket.emit('create_room', { playerName: name }, (res) => {
      if (res.error) { alert(res.error); return; }
      setRoomCode(res.roomCode);
      setIsHost(true);
      setPlayers(res.players);
      setScreen('waiting');
      startRttMeasurement();
    });
  }, []);

  const handleJoinRoom = useCallback((code, name) => {
    socket.emit('join_room', { roomCode: code, playerName: name }, (res) => {
      if (res.error) { alert(res.error); return; }
      setRoomCode(res.roomCode);
      setIsHost(false);
      setPlayers(res.players);
      setScreen('waiting');
      startRttMeasurement();
    });
  }, []);

  const handleStart = useCallback(() => {
    socket.emit('start_game', {});
  }, []);

  const handleTap = useCallback((signalId, tapIndex) => {
    socket.emit('tap', { signalId, tapIndex, timestamp: Date.now() });
  }, []);

  const handleRematch = useCallback(() => {
    socket.emit('rematch');
  }, []);

  const handleExit = useCallback(() => {
    stopRttMeasurement();
    socket.disconnect();
    socket.connect();
    setScreen('lobby');
    setRoomCode('');
    setIsHost(false);
    setPlayers([]);
    setResults(null);
    setSignal(null);
    setDisconnected(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  switch (screen) {
    case 'lobby':
      return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;

    case 'waiting':
      return (
        <WaitingRoom
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          onStart={handleStart}
        />
      );

    case 'countdown':
      return <Countdown count={countdown} players={players} />;

    case 'game':
      return (
        <Game
          signal={signal}
          signalResult={signalResult}
          scores={scores}
          progress={progress}
          playerId={playerId || socket.id}
          onTap={handleTap}
          disconnected={disconnected}
        />
      );

    case 'results':
      return (
        <Results
          results={results}
          playerId={playerId || socket.id}
          isHost={isHost}
          onRematch={handleRematch}
          onExit={handleExit}
        />
      );

    default:
      return null;
  }
}
