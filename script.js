const introText = document.getElementById("introText");
const pressStart = document.getElementById("pressStart");

function showText(text, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      introText.textContent = text;
      introText.style.opacity = 1;
      resolve();
    }, delay);
  });
}

async function startIntro() {
  await showText("Game Center Introduces...", 0);
  await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s
  introText.style.opacity = 0;

  await new Promise(r => setTimeout(r, 500)); // Wait .5s fade
  await showText("PONG", 0);
  introText.style.fontSize = "4rem";
  await new Promise(r => setTimeout(r, 1000));

  pressStart.textContent = "Press SPACE to Start";
  pressStart.style.opacity = 1;

  // Optional: press space to continue
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      document.getElementById("intro").style.display = "none";
      // Start your game here
      console.log("Game started!");
    }
  });
}

startIntro();
