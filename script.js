// ===== Intro animation =====
const introEl = document.getElementById("intro");
const introText = document.getElementById("introText");
const pressStart = document.getElementById("pressStart");
const hud = document.getElementById("hud");

function showText(text, sizeRem = 2) {
  introText.style.opacity = 0;
  return new Promise(r => {
    setTimeout(() => {
      introText.textContent = text;
      introText.style.fontSize = sizeRem + "rem";
      introText.style.opacity = 1;
      r();
    }, 50);
  });
}

async function runIntro() {
  hud.style.visibility = "hidden";
  await showText("Game Center Introduces…", 2);
  await new Promise(r => setTimeout(r, 1500));

  introText.style.opacity = 0;
  await new Promise(r => setTimeout(r, 500)); // 0.5s gap

  await showText("PONG", 4);
  await new Promise(r => setTimeout(r, 800));

  pressStart.textContent = "Press SPACE to Start";
  pressStart.style.opacity = 1;
}

let gameStarted = false;
document.addEventListener("keydown", (e) => {
  if (!gameStarted && e.code === "Space") {
    gameStarted = true;
    // fade and then fully remove the intro so it can't overlay
    introEl.classList.add("fadeOut");
    setTimeout(() => { introEl.style.display = "none"; }, 600);
    hud.style.visibility = "visible";
    loop(); // start the game now
  }
});

runIntro();

// ===== Retro Pong =====
const c = document.getElementById("c"), g = c.getContext("2d");
const W = c.width, H = c.height;
let ly = H/2-30, ry = H/2-30, bx = W/2, by = H/2, vx = 3, vy = 2;
const P = 8, PH = 60, S = 4, B = 8, k = {};
const GREEN = "#00ff9c";

// Scoreboard
const leftScoreEl  = document.getElementById("leftScore");
const rightScoreEl = document.getElementById("rightScore");
let leftScore = 0, rightScore = 0;

onkeydown = e => k[e.key] = 1;
onkeyup   = e => k[e.key] = 0;

function serve(towardRight = true) {
  bx = W/2; by = H/2;
  vx = (towardRight ? 1 : -1) * 3;
  vy = (Math.random() * .6 - .3) * 4;
}

function updateScore() {
  leftScoreEl.textContent  = leftScore;
  rightScoreEl.textContent = rightScore;
}

function loop(){
  // paddles
  if(k.w) ly = Math.max(0, ly - S);
  if(k.s) ly = Math.min(H - PH, ly + S);
  if(k.ArrowUp)   ry = Math.max(0, ry - S);
  if(k.ArrowDown) ry = Math.min(H - PH, ry + S);

  // ball
  bx += vx; by += vy;
  if(by <= 0 || by + B >= H){ vy *= -1; by = Math.max(0, Math.min(H - B, by)); }

  // collisions
  if(bx <= 16 + P && by + B > ly && by < ly + PH && vx < 0){
    vx *= -1; bx = 16 + P;
    vy += ((by + B/2) - (ly + PH/2)) / 20;
  }
  if(bx + B >= W - 16 - P && by + B > ry && by < ry + PH && vx > 0){
    vx *= -1; bx = W - 16 - P - B;
    vy += ((by + B/2) - (ry + PH/2)) / 20;
  }

  // out of bounds -> score + serve toward the player who conceded
  if(bx < -30){
    rightScore++; updateScore();
    serve(false); // send toward left player (who conceded)
  }
  if(bx > W + 30){
    leftScore++; updateScore();
    serve(true); // send toward right player (who conceded)
  }

  // draw
  g.clearRect(0,0,W,H);
  g.fillStyle = GREEN;

  // center dashed line (retro)
  g.globalAlpha = .6;
  for(let y=0;y<H;y+=16) g.fillRect(W/2 - 1, y, 2, 10);
  g.globalAlpha = 1;

  // paddles and ball with glow
  g.shadowColor = GREEN;
  g.shadowBlur = 12;
  g.fillRect(16, ly, P, PH);
  g.fillRect(W - 16 - P, ry, P, PH);
  g.fillRect(bx, by, B, B);
  g.shadowBlur = 0;

  requestAnimationFrame(loop);
}

// Note: loop() starts after Spacebar during the intro.
