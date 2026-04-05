# Duel Tap

Juego de reflejos multijugador en tiempo real. 2 jugadores, mobile-first, 10 señales por partida.

## Stack

| Capa | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express + Socket.io |
| Comunicación | WebSockets (socket.io) |

## Setup local

### 1. Servidor

```bash
cd server
npm install
npm run dev        # node --watch src/index.js → :3001
```

### 2. Cliente

```bash
cd client
npm install
cp .env.example .env
npm run dev        # Vite → http://localhost:5173
```

### Testing desde celular (misma red WiFi)

1. Averiguá la IP de tu máquina: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Editá `client/.env`:
   ```
   VITE_SERVER_URL=http://192.168.x.x:3001
   ```
3. Abrí `http://192.168.x.x:5173` en ambos celulares

## Señales

| Señal | Visual | Acción | Puntos |
|---|---|---|---|
| 🟢 GO | Fondo verde · `¡YA!` | Tocar primero | +2 (empate +1 c/u) |
| 🔴 STOP | Fondo rojo · `NO` | No tocar | —1 si tocás |
| ⚡ DOBLE | Fondo amarillo · `2×` | 2 toques < 600 ms | +3 |
| 💀 RIVAL | Fondo negro · `RIVAL` | Solo toca el designado | +2 al designado / —1 al que no debía |

## Estructura

```
dueltap/
├── server/
│   └── src/
│       ├── index.js         # Socket.io + event handlers
│       ├── roomManager.js   # CRUD de salas en memoria
│       └── gameEngine.js    # Lógica de partida, árbitro de taps
└── client/
    └── src/
        ├── App.jsx          # Máquina de estados de pantallas
        ├── socket.js        # Cliente socket.io + RTT tracking
        └── components/
            ├── Lobby.jsx
            ├── WaitingRoom.jsx
            ├── Countdown.jsx
            ├── Game.jsx
            └── Results.jsx
```
