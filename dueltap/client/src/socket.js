import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(SERVER_URL, { autoConnect: false });

let _rttInterval = null;
let _samples = [];

export function startRttMeasurement() {
  stopRttMeasurement();
  _samples = [];

  socket.off('pong_rtt');
  socket.on('pong_rtt', ({ t }) => {
    const rtt = Date.now() - t;
    _samples.push(rtt);
    if (_samples.length > 6) _samples.shift();
    const avg = Math.round(_samples.reduce((a, b) => a + b, 0) / _samples.length);
    socket.emit('update_rtt', { rtt: avg });
  });

  const ping = () => socket.emit('ping_rtt', { t: Date.now() });
  ping();
  _rttInterval = setInterval(ping, 4000);
}

export function stopRttMeasurement() {
  if (_rttInterval) { clearInterval(_rttInterval); _rttInterval = null; }
  socket.off('pong_rtt');
}
