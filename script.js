(() => {
  // ======= DOM =======
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const overlay = document.getElementById("overlay");
  const scoreL = document.getElementById("score-left");
  const scoreR = document.getElementById("score-right");
  const timerEl = document.getElementById("timer");

  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnReset = document.getElementById("btn-reset");
  const btnApply = document.getElementById("btn-apply");
  const btnDefaults = document.getElementById("btn-defaults");
  const btnImport = document.getElementById("btn-import");
  const linkExport = document.getElementById("link-export");
  const importFile = document.getElementById("import-file");

  const optPlayers = document.getElementById("opt-players");
  const optAI = document.getElementById("opt-ai");
  const optMode = document.getElementById("opt-mode");
  const optTarget = document.getElementById("opt-target");
  const optTimer = document.getElementById("opt-timer");
  const optBall = document.getElementById("opt-ball");
  const optGrowth = document.getElementById("opt-growth");
  const optPad = document.getElementById("opt-pad");
  const optWalls = document.getElementById("opt-walls");
  const optAimToWinner = document.getElementById("opt-aimtowinner");
  const optTouch = document.getElementById("opt-touch");

  const aiOnlyRows = document.querySelectorAll(".ai-only");
  const timeOnlyRows = document.querySelectorAll(".time-only");
  const touchUI = document.getElementById("touch");

  // ======= Settings =======
  const DEFAULTS = {
    players: 1,
    ai: "normal",
    mode: "classic", // classic,time,sudden,multiball,curve,power,endless
    target: 7,
    timerSec: 120,
    ballSpeed: 380,
    speedGrowth: 1.04,
    paddleH: 100,
    walls: "open", // open,wrap,solid
    serveTowardConceder: true,
    touchControls: true,
  };

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem("pongDeluxeSettings"));
      return s ? { ...DEFAULTS, ...s } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }
  function saveSettings(s) {
    localStorage.setItem("pongDeluxeSettings", JSON.stringify(s));
  }
  let SETTINGS = loadSettings();

  function reflectSettingsToUI() {
    optPlayers.value = String(SETTINGS.players);
    optAI.value = SETTINGS.ai;
    optMode.value = SETTINGS.mode;
    optTarget.value = SETTINGS.target;
    optTimer.value = SETTINGS.timerSec;
    optBall.value = SETTINGS.ballSpeed;
    optGrowth.value = SETTINGS.speedGrowth;
    optPad.value = SETTINGS.paddleH;
    optWalls.value = SETTINGS.walls;
    optAimToWinner.checked = SETTINGS.serveTowardConceder;
    optTouch.checked = SETTINGS.touchControls;

    // UI visibility
    for (const el of aiOnlyRows) el.classList.toggle("hidden", SETTINGS.players !== 1);
    for (const el of timeOnlyRows) el.classList.toggle("hidden", SETTINGS.mode !== "time");
  }
  reflectSettingsToUI();

  function readUIIntoSettings() {
    SETTINGS.players = Number(optPlayers.value);
    SETTINGS.ai = optAI.value;
    SETTINGS.mode = optMode.value;
    SETTINGS.target = Math.max(1, Math.min(50, Number(optTarget.value)));
    SETTINGS.timerSec = Math.max(15, Math.min(600, Number(optTimer.value)));
    SETTINGS.ballSpeed = Number(optBall.value);
    SETTINGS.speedGrowth = Number(optGrowth.value);
    SETTINGS.paddleH = Number(optPad.value);
    SETTINGS.walls = optWalls.value;
    SETTINGS.serveTowardConceder = optAimToWinner.checked;
    SETTINGS.touchControls = optTouch.checked;
    saveSettings(SETTINGS);
    reflectSettingsToUI();
  }

  // Auto-toggle rows when selects change
  optPlayers.addEventListener("change", () => { readUIIntoSettings(); resetGame(); });
  optMode.addEventListener("change", () => { readUIIntoSettings(); resetGame(); });
  btnApply.addEventListener("click", () => { readUIIntoSettings(); resetGame(); });
  btnDefaults.addEventListener("click", () => { SETTINGS = { ...DEFAULTS }; saveSettings(SETTINGS); reflectSettingsToUI(); resetGame(); });

  // Export / Import settings
  linkExport.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify(SETTINGS, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    linkExport.href = url;
    linkExport.download = "pong-deluxe-settings.json";
  });
  btnImport.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const s = JSON.parse(text);
      SETTINGS = { ...DEFAULTS, ...s };
      saveSettings(SETTINGS);
      reflectSettingsToUI();
      resetGame();
    } catch {}
  });

  // ======= Game State =======
  const keys = new Set();
  let lastT = performance.now();
  let paused = false;
  let waitingServe = true;
  let nextServeDir = Math.random() < 0.5 ? -1 : 1;
  let timeLeft = SETTINGS.timerSec;

  const paddle = { w: 16, h: SETTINGS.paddleH, speed: 500 };
  const left  = { x: 36, y: (H - paddle.h) / 2, vy: 0, score: 0, ai: false };
  const right = { x: W - 36 - paddle.w, y: (H - paddle.h) / 2, vy: 0, score: 0, ai: false };

  let balls = [];
  let obstacles = []; // rectangles for "solid" wall mode
  let powerups = [];  // active powerups on field

  function centerBall(b) { b.x = W/2; b.y = H/2; b.vx = 0; b.vy = 0; }

  function makeBall() {
    return {
      r: 9,
      x: W/2, y: H/2,
      vx: 0, vy: 0,
      speed: SETTINGS.ballSpeed,
      growth: SETTINGS.speedGrowth,
      maxVy: 560,
      spinK: (SETTINGS.mode === "curve" ? 180 : 0), // curveball mode
      color: "#a8f0ff",
    };
  }

  function serveBall(b, dir = 1) {
    b.x = W/2; b.y = H/2;
    const angle = (Math.random() * 0.7 - 0.35); // ±0.35 rad tilt
    const v = b.speed;
    b.vx = Math.cos(angle) * v * dir;
    b.vy = Math.sin(angle) * v;
  }

  function resetField() {
    balls = [makeBall()];
    obstacles = [];
    powerups = [];
    if (SETTINGS.mode === "multiball") {
      balls.push(makeBall());
      balls.push(makeBall());
    }
    if (SETTINGS.walls === "solid") {
      // Add 1–3 random center obstacles
      const n = 1 + Math.floor(Math.random()*3);
      for (let i=0;i<n;i++){
        const w = 20 + Math.random()*60;
        const h = 60 + Math.random()*140;
        obstacles.push({
          x: W/2 - w/2 + (Math.random()*160 - 80),
          y: H/2 - h/2 + (Math.random()*220 - 110),
          w, h
        });
      }
    }
  }

  function resetGame() {
    // read UI first to pick up any in-flight changes
    readUIIntoSettings();

    // paddles & scores
    paddle.h = SETTINGS.paddleH;
    left.y = (H - paddle.h)/2; left.vy = 0; left.score = 0;
    right.y = (H - paddle.h)/2; right.vy = 0; right.score = 0;

    // AI assignment
    left.ai = false; right.ai = false;
    if (SETTINGS.players === 1) { right.ai = true; } // player left vs AI right by default

    // time & serve
    paused = false;
    waitingServe = true;
    nextServeDir = Math.random()<0.5?-1:1;
    timeLeft = SETTINGS.timerSec;

    resetField();
    for (const b of balls) centerBall(b);

    updateHud();
    overlay.textContent = "Press SPACE to serve";
    showTouchUI(SETTINGS.touchControls);
  }

  function updateHud() {
    scoreL.textContent = left.score;
    scoreR.textContent = right.score;
    if (SETTINGS.mode === "time") {
      timerEl.textContent = `${Math.max(0, Math.ceil(timeLeft))}s`;
    } else {
      timerEl.textContent = "—";
    }
  }

  // ======= Input =======
  window.addEventListener("keydown", (e) => {
    keys.add(e.key);
    if ((e.key === " " || e.code === "Space") && waitingServe) {
      waitingServe = false;
      for (const b of balls) serveBall(b, nextServeDir);
    }
    if (e.key.toLowerCase() === "p") togglePause();
    if (e.key.toLowerCase() === "r") resetGame();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key));

  btnStart.addEventListener("click", () => {
    if (waitingServe) {
      waitingServe = false;
      for (const b of balls) serveBall(b, nextServeDir);
    }
  });
  btnPause.addEventListener("click", togglePause);
  btnReset.addEventListener("click", resetGame);

  function togglePause() {
    if (waitingServe) return; // pausing while waiting is pointless
    paused = !paused;
    overlay.textContent = paused ? "Paused (P to resume)" : "";
  }

  // ======= Touch Controls =======
  function showTouchUI(show) {
    touchUI.classList.toggle("hidden", !show);
  }
  function setTouch(side, dir) {
    const p = side === "left" ? left : right;
    p.vy = dir * paddle.speed;
  }
  touchUI.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".tbtn");
    if (!btn) return;
    const side = btn.dataset.side, dir = Number(btn.dataset.dir);
    setTouch(side, dir);
  });
  touchUI.addEventListener("pointerup", () => {
    left.vy = 0; right.vy = 0;
  });
  touchUI.addEventListener("pointerleave", () => {
    left.vy = 0; right.vy = 0;
  });

  // ======= AI =======
  function aiSpeed() {
    switch (SETTINGS.ai) {
      case "easy": return 360;
      case "normal": return 480;
      case "hard": return 640;
      case "insane": return 920;
      default: return 480;
    }
  }
  function runAI(paddleObj, dt) {
    // Predict primary ball (closest to AI side)
    let targetB = balls[0];
    let bestDist = Infinity;
    for (const b of balls) {
      const dist = Math.abs((paddleObj === right ? W - b.x : b.x));
      if (dist < bestDist) { bestDist = dist; targetB = b; }
    }
    const targetY = targetB.y - paddle.h/2 + (Math.sin(performance.now()/600)*(SETTINGS.ai==="easy"?18:8));
    const sp = aiSpeed();
    const dy = targetY - paddleObj.y;
    const dir = Math.sign(dy);
    paddleObj.vy = dir * sp;
    // Slow near target to avoid perfect tracking
    if (Math.abs(dy) < 8) paddleObj.vy = 0;
  }

  // ======= Physics =======
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function collideBallRect(b, rx, ry, rw, rh) {
    const cx = clamp(b.x, rx, rx+rw);
    const cy = clamp(b.y, ry, ry+rh);
    const dx = b.x - cx, dy = b.y - cy;
    if (dx*dx + dy*dy <= b.r*b.r) {
      // Resolve minimal axis
      const overlapX = (b.r - Math.abs(dx)) || 0.1;
      const overlapY = (b.r - Math.abs(dy)) || 0.1;
      if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
      return true;
    }
    return false;
  }

  function collideWithPaddle(b, p, isLeft) {
    const rx = p.x, ry = p.y, rw = paddle.w, rh = paddle.h;
    const hit = collideBallRect(b, rx, ry, rw, rh);
    if (hit) {
      // Position fix: ensure outside
      if (isLeft) b.x = rx + rw + b.r; else b.x = rx - b.r;
      // Spin based on hit location
      const rel = (b.y - (p.y + rh/2)) / (rh/2); // -1..1
      const newVy = rel * b.maxVy;
      b.speed *= b.growth;
      const newVxMag = Math.sqrt(Math.max(100, b.speed*b.speed - newVy*newVy));
      b.vx = (isLeft ? 1 : -1) * newVxMag;
      b.vy = newVy;

      // Curveball mode: apply sideways Magnus-like effect proportional to relative hit
      if (SETTINGS.mode === "curve" && b.spinK > 0) {
        // Add small perpendicular nudge
        const s = b.spinK * rel;
        b.vx += (isLeft ? 1 : -1) * s * 0.05;
        b.vy -= s * 0.02;
      }

      // Power-up mode: chance to spawn
      if (SETTINGS.mode === "power" && Math.random() < 0.18) spawnPowerUp();
    }
  }

  function spawnPowerUp() {
    // Types: shrink paddle, grow paddle, slow ball, fast ball, multiball, invert controls
    const types = ["growP", "shrinkP", "slowB", "fastB", "multi", "invert"];
    const t = types[Math.floor(Math.random()*types.length)];
    powerups.push({
      x: 80 + Math.random()*(W-160),
      y: 60 + Math.random()*(H-120),
      r: 12,
      type: t,
      ttl: 12, // seconds
    });
  }

  function applyPowerUp(type, sideHit) {
    switch (type) {
      case "growP": (sideHit ? right : left).__grow = Math.min((sideHit?right:left).__grow??0 + 1, 3); break;
      case "shrinkP": (sideHit ? right : left).__shrink = Math.min((sideHit?right:left).__shrink??0 + 1, 3); break;
      case "slowB": for (const b of balls){ b.vx*=0.8; b.vy*=0.8; b.speed*=0.8; } break;
      case "fastB": for (const b of balls){ b.vx*=1.25; b.vy*=1.25; b.speed*=1.25; } break;
      case "multi": balls.push(makeBall()); serveBall(balls[balls.length-1], Math.random()<0.5?-1:1); break;
      case "invert": (sideHit ? right : left).__invert = 6; break;
    }
  }

  function rectsForPaddle(p) {
    // Compute effective height with grow/shrink stacks
    const growMul = 1 + ((p.__grow||0) * 0.3);
    const shrinkMul = 1 - ((p.__shrink||0) * 0.25);
    const effH = clamp(paddle.h * growMul * shrinkMul, 40, 240);
    return { x:p.x, y:p.y + (paddle.h-effH)/2, w:paddle.w, h:effH, effH };
  }

  function update(dt) {
    // Movement input
    left.vy = 0; right.vy = 0;
    const invertL = (left.__invert||0)>0 ? -1 : 1;
    const invertR = (right.__invert||0)>0 ? -1 : 1;

    if (keys.has("w") || keys.has("W")) left.vy = -paddle.speed * invertL;
    if (keys.has("s") || keys.has("S")) left.vy = +paddle.speed * invertL;
    if (!right.ai) {
      if (keys.has("ArrowUp")) right.vy = -paddle.speed * invertR;
      if (keys.has("ArrowDown")) right.vy = +paddle.speed * invertR;
    }

    // AI
    if (right.ai) runAI(right, dt);
    if (left.ai) runAI(left, dt); // (disabled by default, but supported)

    // Apply movement & clamp
    left.y = clamp(left.y + left.vy*dt, 0, H - paddle.h);
    right.y = clamp(right.y + right.vy*dt, 0, H - paddle.h);

    // Decrement temporary effects timers
    if (left.__invert) left.__invert -= dt;
    if (right.__invert) right.__invert -= dt;
    if (left.__grow) left.__grow -= dt*0.25;
    if (left.__shrink) left.__shrink -= dt*0.25;
    if (right.__grow) right.__grow -= dt*0.25;
    if (right.__shrink) right.__shrink -= dt*0.25;

    // Timer mode
    if (!waitingServe && SETTINGS.mode === "time") {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        waitingServe = true;
        timeLeft = 0;
        overlay.textContent = (left.score === right.score) ? "Time! Tie game." :
          (left.score > right.score ? "Time! Left wins." : "Time! Right wins.");
      }
    }

    // Ball updates
    const leftRect = rectsForPaddle(left);
    const rightRect = rectsForPaddle(right);

    for (const b of balls) {
      if (waitingServe || paused) continue;

      // Movement + optional wall mode
      b.x += b.vx*dt;
      b.y += b.vy*dt;

      // Walls behaviour
      if (SETTINGS.walls === "open" || SETTINGS.walls === "solid") {
        if (b.y - b.r < 0) { b.y = b.r; b.vy = -b.vy; }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -b.vy; }
      } else if (SETTINGS.walls === "wrap") {
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;
      }

      // Obstacles (solid mode)
      if (SETTINGS.walls === "solid") {
        for (const o of obstacles) collideBallRect(b, o.x, o.y, o.w, o.h);
      }

      // Paddles
      if (collideBallRect(b, leftRect.x, leftRect.y, leftRect.w, leftRect.h)) {
        // rebuild as paddle hit with spin/curve/power chance
        collideWithPaddle(b, {x:leftRect.x, y:leftRect.y}, true);
      }
      if (collideBallRect(b, rightRect.x, rightRect.y, rightRect.w, rightRect.h)) {
        collideWithPaddle(b, {x:rightRect.x, y:rightRect.y}, false);
      }

      // Powerups collection
      if (SETTINGS.mode === "power") {
        for (let i=powerups.length-1;i>=0;i--){
          const p = powerups[i];
          const dx = b.x - p.x, dy = b.y - p.y;
          if (dx*dx + dy*dy <= (b.r + p.r)*(b.r + p.r)) {
            // Determine side that last touched the ball (by vx sign)
            const sideHit = b.vx > 0; // moving right -> right collects
            applyPowerUp(p.type, sideHit);
            powerups.splice(i,1);
          }
        }
      }

      // Scoring
      if (b.x + b.r < 0) {
        // Right scores
        right.score++;
        if (SETTINGS.serveTowardConceder) nextServeDir = -1; else nextServeDir = 1;
        onScore();
        break;
      } else if (b.x - b.r > W) {
        // Left scores
        left.score++;
        if (SETTINGS.serveTowardConceder) nextServeDir = 1; else nextServeDir = -1;
        onScore();
        break;
      }
    }

    // Powerups TTL
    if (SETTINGS.mode === "power") {
      for (let i=powerups.length-1;i>=0;i--) {
        powerups[i].ttl -= dt;
        if (powerups[i].ttl <= 0) powerups.splice(i,1);
      }
    }
  }

  function onScore() {
    updateHud();
    overlay.textContent = "Point scored! Press SPACE to serve";
    waitingServe = true;
    for (const b of balls) { b.speed = SETTINGS.ballSpeed; centerBall(b); }
    if (checkWin()) return;
  }

  function checkWin() {
    if (SETTINGS.mode === "classic") {
      if (left.score >= SETTINGS.target || right.score >= SETTINGS.target) {
        overlay.textContent = left.score > right.score ? "Left Wins!" : "Right Wins!";
        return true;
      }
    } else if (SETTINGS.mode === "sudden") {
      if (left.score >= 1 || right.score >= 1) {
        overlay.textContent = left.score > right.score ? "Left Wins!" : "Right Wins!";
        return true;
      }
    }
    return false;
  }

  // ======= Rendering =======
  function draw() {
    // Background
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0b0f1a";
    ctx.fillRect(0,0,W,H);

    // Midline
    ctx.setLineDash([12,14]);
    ctx.strokeStyle = "#2a3358";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W/2, 0);
    ctx.lineTo(W/2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles
    if (SETTINGS.walls === "solid") {
      ctx.fillStyle = "#18214a";
      for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // Scores
    ctx.fillStyle = "#e8eaf6";
    ctx.font = "bold 56px system-ui, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.fillText(left.score, W/2 - 90, 70);
    ctx.fillText(right.score, W/2 + 90, 70);

    // Paddles (with grow/shrink applied)
    const lr = rectsForPaddle(left), rr = rectsForPaddle(right);
    ctx.fillStyle = "#b8c1ff";
    ctx.fillRect(lr.x, lr.y, lr.w, lr.h);
    ctx.fillRect(rr.x, rr.y, rr.w, rr.h);

    // Balls
    for (const b of balls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    // Powerups
    if (SETTINGS.mode === "power") {
      for (const p of powerups) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = powerColor(p.type);
        ctx.fill();
        ctx.strokeStyle = "#0a0d1a"; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    // Overlay
    overlay.style.opacity = (waitingServe || paused) ? "1" : "0";
  }

  function powerColor(t){
    switch(t){
      case "growP": return "#58e09f";
      case "shrinkP": return "#ff5d7d";
      case "slowB": return "#77b6ff";
      case "fastB": return "#ffd166";
      case "multi": return "#c792ea";
      case "invert": return "#ff9e64";
      default: return "#ccc";
    }
  }

  // ======= Loop =======
  function loop(t) {
    const dt = Math.min(0.033, (t - lastT)/1000);
    lastT = t;
    if (!paused) update(dt);
    draw();
    updateHud();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ======= Init =======
  resetGame();

})();
