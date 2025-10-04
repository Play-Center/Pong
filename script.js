// Retro-green minimal Pong (W/S for left, ArrowUp/ArrowDown for right)
const c = document.getElementById("c"), g = c.getContext("2d");
const W = c.width, H = c.height;
let ly = H/2-30, ry = H/2-30, bx = W/2, by = H/2, vx = 3, vy = 2;
const P = 8, PH = 60, S = 4, B = 8, k = {};
const GREEN = "#00ff9c";

onkeydown = e => k[e.key] = 1;
onkeyup   = e => k[e.key] = 0;

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
  if(bx <= 16 + P && by + B > ly && by < ly + PH && vx < 0){ vx *= -1; bx = 16 + P; vy += ((by + B/2) - (ly + PH/2)) / 20; }
  if(bx + B >= W - 16 - P && by + B > ry && by < ry + PH && vx > 0){ vx *= -1; bx = W - 16 - P - B; vy += ((by + B/2) - (ry + PH/2)) / 20; }

  // reset if out
  if(bx < -30 || bx > W + 30){
    bx = W/2; by = H/2;
    vx = (Math.random() < .5 ? -1 : 1) * 3;
    vy = (Math.random() * .6 - .3) * 4;
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
loop();
