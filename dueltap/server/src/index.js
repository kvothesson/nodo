import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRoom, joinRoom, getRoomByPlayerId, removeRoom } from './roomManager.js';
import { GameSession } from './gameEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.get('/health', (_, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── RTT tracking ──────────────────────────────────────────────────────────
  socket.on('ping_rtt', (data) => {
    socket.emit('pong_rtt', data);
  });

  socket.on('update_rtt', ({ rtt }) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.rtt = Math.min(Math.max(rtt, 10), 500);
  });

  // ── Crear sala ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }, cb) => {
    if (!playerName?.trim()) return cb({ error: 'Nombre requerido' });
    const room = createRoom(socket.id, playerName.trim().slice(0, 12));
    socket.join(room.code);
    cb({ roomCode: room.code, players: room.players, isHost: true });
    console.log(`Room ${room.code} created by ${playerName}`);
  });

  // ── Unirse a sala ──────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }, cb) => {
    if (!playerName?.trim()) return cb({ error: 'Nombre requerido' });
    if (!roomCode?.trim()) return cb({ error: 'Código requerido' });

    const result = joinRoom(roomCode.trim(), socket.id, playerName.trim().slice(0, 12));
    if (result.error) return cb({ error: result.error });

    const { room } = result;
    socket.join(room.code);
    cb({ roomCode: room.code, players: room.players, isHost: false });

    io.to(room.code).emit('room_state', { players: room.players, status: room.status });
    console.log(`${playerName} joined room ${room.code}`);
  });

  // ── Iniciar partida ────────────────────────────────────────────────────────
  socket.on('start_game', (data, cb) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return cb?.({ error: 'No estás en ninguna sala' });
    if (room.hostId !== socket.id) return cb?.({ error: 'Solo el host puede iniciar' });
    if (room.players.length < 2) return cb?.({ error: 'Se necesitan 2 jugadores' });
    if (room.status !== 'waiting' && room.status !== 'results') return;

    // Resetear puntajes
    for (const p of room.players) p.score = 0;
    room.status = 'countdown';

    // Countdown 3-2-1
    const counts = [3, 2, 1];
    counts.forEach((c, i) => {
      setTimeout(() => {
        io.to(room.code).emit('countdown', { count: c });
      }, i * 1000);
    });

    setTimeout(() => {
      if (room.game) room.game.destroy();
      const session = new GameSession(room, io);
      room.game = session;
      room.status = 'playing';
      session.start();
    }, counts.length * 1000);

    cb?.({ ok: true });
  });

  // ── Tap ────────────────────────────────────────────────────────────────────
  socket.on('tap', (data) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room?.game) return;
    room.game.handleTap(socket.id, data);
  });

  // ── Revancha ───────────────────────────────────────────────────────────────
  socket.on('rematch', () => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) return;

    for (const p of room.players) p.score = 0;
    if (room.game) { room.game.destroy(); room.game = null; }
    room.status = 'waiting';

    io.to(room.code).emit('room_state', { players: room.players, status: 'waiting' });
  });

  // ── Desconexión ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;

    // Cancelar timer previo de reconexión si existía
    if (room.disconnectTimers[socket.id]) {
      clearTimeout(room.disconnectTimers[socket.id]);
      delete room.disconnectTimers[socket.id];
    }

    if (room.status === 'playing' || room.status === 'countdown') {
      io.to(room.code).emit('opponent_disconnected', { timeout: 10000 });

      room.disconnectTimers[socket.id] = setTimeout(() => {
        const remaining = room.players.find((p) => p.id !== socket.id);
        if (remaining) {
          io.to(remaining.id).emit('game_over', {
            scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
            stats: {},
            winner: remaining.id,
            forfeit: true,
          });
        }
        _cleanupRoom(room, socket.id);
      }, 10000);
    } else {
      _cleanupRoom(room, socket.id);
    }
  });

  function _cleanupRoom(room, socketId) {
    if (room.game) { room.game.destroy(); room.game = null; }
    room.players = room.players.filter((p) => p.id !== socketId);

    if (room.players.length === 0) {
      removeRoom(room.code);
      return;
    }

    room.hostId = room.players[0].id;
    room.status = 'waiting';
    io.to(room.code).emit('room_state', { players: room.players, status: 'waiting' });
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Duel Tap server running on :${PORT}`);
});
