const TOTAL_SIGNALS = 10;
const RESPONSE_WINDOW_MS = 1000;
const DOUBLE_TAP_WINDOW_MS = 600;
const TIE_THRESHOLD_MS = 50;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 4000;

// Garantizamos 3xGO, 2xSTOP, 2xDOUBLE, 2xRIVAL + 1xGO extra
const SIGNAL_POOL = ['GO', 'GO', 'GO', 'GO', 'STOP', 'STOP', 'DOUBLE', 'DOUBLE', 'RIVAL', 'RIVAL'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export class GameSession {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.sequence = shuffle([...SIGNAL_POOL]);
    this.signalIndex = -1;
    this.signal = null;
    this._signalTimer = null;
    this._resolveTimer = null;
    this._tieTimer = null;

    this.scores = {};
    this.stats = {};
    for (const p of room.players) {
      this.scores[p.id] = 0;
      this.stats[p.id] = { reactionTimes: [], correct: 0, incorrect: 0 };
    }
  }

  start() {
    this._scheduleNext();
  }

  _scheduleNext() {
    this.io.to(this.room.code).emit('signal_clear');
    this._signalTimer = setTimeout(() => this._emitSignal(), randomDelay());
  }

  _emitSignal() {
    this.signalIndex++;
    if (this.signalIndex >= TOTAL_SIGNALS) {
      this._endGame();
      return;
    }

    const type = this.sequence[this.signalIndex];
    const signalId = `${this.signalIndex}_${Date.now()}`;
    const issuedAt = Date.now();

    let rivalId = null;
    if (type === 'RIVAL') {
      rivalId = this.room.players[Math.floor(Math.random() * 2)].id;
    }

    this.signal = {
      type,
      signalId,
      issuedAt,
      rivalId,
      resolved: false,
      singleTaps: {},      // playerId -> { receivedAt, reactionMs }
      doubleTaps: {},      // playerId -> [{ receivedAt, reactionMs }]
      doubleDone: {},      // playerId -> { completedAt, reactionMs }
    };

    for (const player of this.room.players) {
      const payload = {
        type,
        signalId,
        signalIndex: this.signalIndex,
        totalSignals: TOTAL_SIGNALS,
        scores: this._scorePayload(),
      };
      if (type === 'RIVAL') {
        payload.isRival = player.id === rivalId;
      }
      this.io.to(player.id).emit('signal', payload);
    }

    this._resolveTimer = setTimeout(() => {
      if (!this.signal.resolved) this._resolve();
    }, RESPONSE_WINDOW_MS);
  }

  handleTap(playerId, data) {
    const { signalId } = data;
    if (!this.signal || this.signal.signalId !== signalId) return;
    if (this.signal.resolved) return;

    const receivedAt = Date.now();
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    const reactionMs = Math.max(0, receivedAt - this.signal.issuedAt - player.rtt / 2);
    const { type } = this.signal;

    if (type === 'GO') {
      this._handleGoTap(playerId, receivedAt, reactionMs);
    } else if (type === 'STOP') {
      this._handleStopTap(playerId, reactionMs);
    } else if (type === 'DOUBLE') {
      this._handleDoubleTap(playerId, receivedAt, reactionMs);
    } else if (type === 'RIVAL') {
      this._handleRivalTap(playerId, receivedAt, reactionMs);
    }
  }

  _handleGoTap(playerId, receivedAt, reactionMs) {
    if (this.signal.singleTaps[playerId]) return;
    this.signal.singleTaps[playerId] = { receivedAt, reactionMs };

    const tapCount = Object.keys(this.signal.singleTaps).length;
    if (tapCount === 1) {
      clearTimeout(this._tieTimer);
      this._tieTimer = setTimeout(() => {
        if (!this.signal.resolved) this._resolve();
      }, TIE_THRESHOLD_MS);
    } else {
      clearTimeout(this._tieTimer);
      if (!this.signal.resolved) this._resolve();
    }
  }

  _handleStopTap(playerId, reactionMs) {
    if (!this.signal.singleTaps[playerId]) {
      this.signal.singleTaps[playerId] = { reactionMs };
    }
  }

  _handleDoubleTap(playerId, receivedAt, reactionMs) {
    if (!this.signal.doubleTaps[playerId]) {
      this.signal.doubleTaps[playerId] = [];
    }
    const taps = this.signal.doubleTaps[playerId];
    if (taps.length >= 2) return;

    taps.push({ receivedAt, reactionMs });

    if (taps.length === 2) {
      const diff = taps[1].receivedAt - taps[0].receivedAt;
      if (diff <= DOUBLE_TAP_WINDOW_MS && diff > 0) {
        this.signal.doubleDone[playerId] = {
          completedAt: taps[1].receivedAt,
          reactionMs: taps[0].reactionMs,
        };
        const doneCount = Object.keys(this.signal.doubleDone).length;
        if (doneCount === 1) {
          clearTimeout(this._tieTimer);
          this._tieTimer = setTimeout(() => {
            if (!this.signal.resolved) this._resolve();
          }, TIE_THRESHOLD_MS);
        } else {
          clearTimeout(this._tieTimer);
          if (!this.signal.resolved) this._resolve();
        }
      }
    }
  }

  _handleRivalTap(playerId, receivedAt, reactionMs) {
    const { rivalId } = this.signal;
    if (!this.signal.singleTaps[playerId]) {
      this.signal.singleTaps[playerId] = { receivedAt, reactionMs };
    }
    if (playerId === rivalId) {
      clearTimeout(this._resolveTimer);
      if (!this.signal.resolved) this._resolve();
    }
  }

  _resolve() {
    if (!this.signal || this.signal.resolved) return;
    this.signal.resolved = true;
    clearTimeout(this._resolveTimer);
    clearTimeout(this._tieTimer);

    const { type, singleTaps, doubleDone, rivalId } = this.signal;
    const [p1, p2] = this.room.players;
    const pointChanges = { [p1.id]: 0, [p2.id]: 0 };
    let winner = null;
    const reactions = {};

    if (type === 'GO') {
      const entries = Object.entries(singleTaps).sort(
        (a, b) => a[1].receivedAt - b[1].receivedAt
      );
      if (entries.length === 0) {
        // nadie tocó
      } else if (entries.length === 1) {
        const [pid, tap] = entries[0];
        pointChanges[pid] += 2;
        winner = pid;
        reactions[pid] = Math.round(tap.reactionMs);
        this._updateStats(pid, tap.reactionMs, true);
      } else {
        const [first, second] = entries;
        reactions[first[0]] = Math.round(first[1].reactionMs);
        reactions[second[0]] = Math.round(second[1].reactionMs);
        const diff = second[1].receivedAt - first[1].receivedAt;
        if (diff <= TIE_THRESHOLD_MS) {
          pointChanges[first[0]] += 1;
          pointChanges[second[0]] += 1;
          winner = 'tie';
          this._updateStats(first[0], first[1].reactionMs, true);
          this._updateStats(second[0], second[1].reactionMs, true);
        } else {
          pointChanges[first[0]] += 2;
          winner = first[0];
          this._updateStats(first[0], first[1].reactionMs, true);
          this._updateStats(second[0], second[1].reactionMs, false);
        }
      }
    } else if (type === 'STOP') {
      for (const [pid] of Object.entries(singleTaps)) {
        pointChanges[pid] -= 1;
        this._updateStats(pid, null, false);
      }
    } else if (type === 'DOUBLE') {
      const entries = Object.entries(doubleDone).sort(
        (a, b) => a[1].completedAt - b[1].completedAt
      );
      if (entries.length === 0) {
        // nadie completó
      } else if (entries.length === 1) {
        const [pid, done] = entries[0];
        pointChanges[pid] += 3;
        winner = pid;
        reactions[pid] = Math.round(done.reactionMs);
        this._updateStats(pid, done.reactionMs, true);
      } else {
        const [first, second] = entries;
        const diff = second[1].completedAt - first[1].completedAt;
        reactions[first[0]] = Math.round(first[1].reactionMs);
        if (diff <= TIE_THRESHOLD_MS) {
          pointChanges[first[0]] += 2;
          pointChanges[second[0]] += 2;
          winner = 'tie';
          this._updateStats(first[0], first[1].reactionMs, true);
          this._updateStats(second[0], second[1].reactionMs, true);
        } else {
          pointChanges[first[0]] += 3;
          winner = first[0];
          this._updateStats(first[0], first[1].reactionMs, true);
          this._updateStats(second[0], second[1].reactionMs, false);
        }
      }
    } else if (type === 'RIVAL') {
      const nonRivalId = this.room.players.find((p) => p.id !== rivalId).id;
      if (singleTaps[nonRivalId]) {
        pointChanges[nonRivalId] -= 1;
        this._updateStats(nonRivalId, null, false);
      }
      if (singleTaps[rivalId]) {
        const tap = singleTaps[rivalId];
        pointChanges[rivalId] += 2;
        winner = rivalId;
        reactions[rivalId] = Math.round(tap.reactionMs);
        this._updateStats(rivalId, tap.reactionMs, true);
      }
    }

    for (const [pid, change] of Object.entries(pointChanges)) {
      this.scores[pid] = Math.max(0, this.scores[pid] + change);
    }

    this.io.to(this.room.code).emit('signal_result', {
      signalId: this.signal.signalId,
      type,
      winner,
      pointChanges,
      scores: this._scorePayload(),
      reactions,
      rivalId,
    });

    setTimeout(() => this._scheduleNext(), 1000);
  }

  _updateStats(playerId, reactionMs, correct) {
    const s = this.stats[playerId];
    if (!s) return;
    if (correct) s.correct++;
    else s.incorrect++;
    if (reactionMs != null && reactionMs > 0 && reactionMs < RESPONSE_WINDOW_MS) {
      s.reactionTimes.push(reactionMs);
    }
  }

  _scorePayload() {
    return this.room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: this.scores[p.id],
    }));
  }

  _endGame() {
    this.room.status = 'results';

    const statsPayload = {};
    for (const p of this.room.players) {
      const s = this.stats[p.id];
      const rts = s.reactionTimes;
      statsPayload[p.id] = {
        name: p.name,
        score: this.scores[p.id],
        correct: s.correct,
        incorrect: s.incorrect,
        avgReaction: rts.length > 0
          ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
          : null,
        fastest: rts.length > 0 ? Math.round(Math.min(...rts)) : null,
      };
    }

    const scores = this._scorePayload();
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0].score === sorted[1].score ? 'tie' : sorted[0].id;

    this.io.to(this.room.code).emit('game_over', { scores, stats: statsPayload, winner });
  }

  destroy() {
    clearTimeout(this._signalTimer);
    clearTimeout(this._resolveTimer);
    clearTimeout(this._tieTimer);
  }
}
