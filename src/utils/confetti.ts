import confetti from 'canvas-confetti';

export function fireVictoryConfetti() {
  confetti({
    particleCount: 75,
    spread: 65,
    origin: { y: 0.6 },
    colors: ['#00F0FF', '#FF2E63', '#00E676', '#FFD600', '#B388FF'],
  });
}

export function fireMegaConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;

  const interval: NodeJS.Timeout = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 40 * (timeLeft / duration);
    confetti({
      particleCount,
      spread: 360,
      startVelocity: 30,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
      colors: ['#00F0FF', '#FF2E63', '#FFD600', '#00E676', '#FF9100'],
    });
  }, 250);
}
