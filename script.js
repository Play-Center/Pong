(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // World size (internal pixels)
  const W = canvas.width;   // 800
  const H = canvas.height;  // 500

  // Game state
  const paddle = { w: 14, h: 90, speed: 420 }; // px/s
  const left  = { x: 30,               y: (H - paddle.h) / 2, vy: 0, score: 0 };
  const right = { x: W - 30 - paddle.w, y: (H - paddle.h) / 2, vy: 0, score: 0 };

  const ball = {
    r: 9,
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    speed: 360,          // base speed
    speedGrowth: 1.04,   // multiplies after each paddle hit
    maxVy: 520,
  };

  const keys = new Set();
  let lastTime = performance.now();

  // Serve control
  let waitingForServe = true;
  let nextServeDir = Math.random() < 0.5 ? -1 : 1; // -1 = toward left, +1 = toward right

  function centerBall() {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = 0;
    ball.vy = 0;
  }

  function serve(direction = Math.random() < 0.5 ? -1 : 1) {
    // Place ball in center and give it velocity in chosen direction
    ball.x = W / 2;
    ball.y = H / 2;

    const angle = (Math.random() * 0.6 - 0.3); // -0.3..0.3 rad vertical tilt
    const v = ball.speed;
    ball.vx = Math.cos(angle) * v * direction;
    ball.vy = Math.sin(angle) * v;
  }

  centerBall(); // on load, ball sits still

  // Input
  window.addEventListener("keydown", (e) => {
    keys.add(e.key);

    // Space starts the round when waiting
    if ((e.key === " " || e.code === "Space") && waitingForServe) {
      waitingForServe = false;
      serve(nextServeDir);
    }

    if (e.key === "r" || e.key === "R") resetGame();
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
  });

  function resetGame() {
    left.y = (H - paddle.h) / 2;  left.vy = 0;  left.score = 0;
    right.y = (H - paddle.h) / 2; right.vy = 0; right.score = 0;
    ball.speed = 360;
    nextServeDir = Math.random() < 0.5 ? -1 : 1;
    waitingForServe = true;
    centerBall();
  }

  function update(dt) {
    // --- Paddle input is active even while waiting (you can position before serve)
    left.vy = 0;
    right.vy = 0;

    if (keys.has("w") || keys.has("W")) left.vy = -paddle.speed;
    if (keys.has("s") || keys.has("S")) left.vy = +paddle.speed;

    if (keys.has("ArrowUp"))   right.vy = -paddle.speed;
    if (keys.has("ArrowDown")) right.vy = +paddle.speed;

    // Move paddles and clamp
    left.y  = Math.max(0, Math.min(H - paddle.h, left.y  + left.vy  * dt));
    right.y = Math.max(0, Math.min(H - paddle.h, right.y + right.vy * dt));

    // If we're waiting to serve, stop here (ball stays centered/paused)
    if (waitingForServe) return;

    // --- Ball physics ---
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Wall collisions (top/bottom)
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
    }
    if (ball.y + ball.r > H) {
      ball.y = H - ball.r;
      ball.vy = -ball.vy;
    }

    // Paddle collisions
    collideWithPaddle(left);
    collideWithPaddle(right);

    // Scoring
    if (ball.x + ball.r < 0) {
      // Right scores, left conceded -> next serve goes toward LEFT (-1)
      right.score++;
      ball.speed = 360;
      nextServeDir = -1;
      waitingForServe = true;
      centerBall();
    } else if (ball.x - ball.r > W) {
      // Left scores, right conceded -> next serve goes toward RIGHT (+1)
      left.score++;
      ball.speed = 360;
      nextServeDir = +1;
      waitingForServe = true;
      centerBall();
    }
  }

  function collideWithPaddle(p) {
    // AABB of paddle
    const px1 = p.x, px2 = p.x + paddle.w;
    const py1 = p.y, py2 = p.y + paddle.h;

    // Closest point on paddle to ball center
    const cx = Math.max(px1, Math.min(ball.x, px2));
    const cy = Math.max(py1, Math.min(ball.y, py2));

    const dx = ball.x - cx;
    const dy = ball.y - cy;

    if (dx * dx + dy * dy <= ball.r * ball.r) {
      // Resolve to outside
      if (ball.x < W / 2) {
        ball.x = px2 + ball.r; // left paddle
      } else {
        ball.x = px1 - ball.r; // right paddle
      }

      // Spin based on impact point
      const hit = (ball.y - (p.y + paddle.h / 2)) / (paddle.h / 2); // -1..1
      const newVy = hit * ball.maxVy;

      // Speed up slightly each hit
      ball.speed *= ball.speedGrowth;

      // Keep overall magnitude reasonable, reflect horizontally
      const newVxMag = Math.sqrt(Math.max(80, ball.speed * ball.speed - newVy * newVy));
      ball.vx = (ball.x < W / 2 ? 1 : -1) * newVxMag;
      ball.vy = newVy;
    }
  }

  // Drawing
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Midline
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#31395f";
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = "#e8eaf6";
    ctx.font = "bold 48px system-ui, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.fillText(left.score,  W / 2 - 80, 70);
    ctx.fillText(right.score, W / 2 + 80, 70);

    // Paddles
    ctx.fillStyle = "#b8c1ff";
    ctx.fillRect(left.x, left.y, paddle.w, paddle.h);
    ctx.fillRect(right.x, right.y, paddle.w, paddle.h);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#a8f0ff";
    ctx.fill();

    // Waiting overlay
    if (waitingForServe) {
      ctx.fillStyle = "#bbb";
      ctx.font = "bold 28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Press SPACE to start", W / 2, H / 2);
    }
  }

  function loop(t) {
    const dt = Math.min(0.033, (t - lastTime) / 1000);
    lastTime = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
