// Your attack surface, explained.
import {
  DEFAULT_DURATION_SECONDS,
  adjustDuration,
  computeFinaleEnvelope,
  formatTime,
  sanitizeDuration,
} from "./modules/countdown-core.js";

const constraints = Object.freeze({ minSeconds: 10, maxSeconds: 4 * 3600 });
const display = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const counterShell = document.getElementById("counter-shell");
const smokeLayer = document.getElementById("smoke-layer");
const detonateMessage = document.getElementById("detonate-message");
const stripItems = Array.from(document.querySelectorAll(".dragon-strip span"));
const adjustButtons = Array.from(document.querySelectorAll("[data-adjust]"));

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const state = {
  totalSeconds: DEFAULT_DURATION_SECONDS,
  status: "idle",
  rafId: null,
  targetTimeMs: null,
  audioContext: null,
};

const logEvent = (type, detail = {}) => {
  const payload = {
    scope: "anomfin.counter",
    type,
    detail,
    at: new Date().toISOString(),
  };
  console.info(JSON.stringify(payload));
};

function ensureAudioContext() {
  if (state.audioContext) return state.audioContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  state.audioContext = new Ctor();
  return state.audioContext;
}

function triggerBeep({ frequencyHz, pulseMs }) {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

  const now = ctx.currentTime;
  const attack = 0.01;
  const decay = Math.max(0.08, pulseMs / 1000 - attack);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.4, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + attack + decay + 0.05);
}

function animateDisplay() {
  if (prefersReducedMotion) return;
  display.animate(
    [
      { opacity: 0.6, transform: "translateY(8px) scale(0.99)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 220, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
  );
}

function renderTimer(seconds) {
  const formatted = formatTime(seconds);
  display.textContent = formatted;
  display.setAttribute("aria-valuenow", String(seconds));
  animateDisplay();

  const envelope = computeFinaleEnvelope(seconds);
  if (envelope.isFinale) {
    counterShell.classList.add("final-ten");
    counterShell.style.setProperty(
      "--finale-intensity",
      envelope.intensity.toFixed(2),
    );
  } else {
    counterShell.classList.remove("final-ten");
    counterShell.style.removeProperty("--finale-intensity");
    display.setAttribute("aria-label", `Aikaa jäljellä ${formatted}`);
  }

  updateStripHighlight(seconds);
}

function updateStripHighlight(seconds) {
  if (!stripItems.length) return;
  const highlightIndex =
    seconds <= 10 ? 3 : seconds <= 300 ? 2 : seconds <= 900 ? 1 : 0;
  stripItems.forEach((item, idx) => {
    item.classList.toggle("active", idx === highlightIndex);
  });
}

function toggleControlsDisabled(disabled) {
  adjustButtons.forEach((btn) => {
    btn.disabled = disabled;
  });
  startBtn.disabled = disabled;
}

function activateFinale() {
  document.body.classList.add("detonated");
  smokeLayer.classList.add("active");
  detonateMessage.classList.add("active");
  toggleControlsDisabled(true);
  startBtn.textContent = "Valmis";
  stripItems.forEach((item) => item.classList.remove("active"));
  logEvent("finale", { totalSeconds: state.totalSeconds });
}

function resetFinale() {
  document.body.classList.remove("detonated");
  smokeLayer.classList.remove("active");
  detonateMessage.classList.remove("active");
  counterShell.classList.remove("final-ten");
  counterShell.style.removeProperty("--finale-intensity");
}

function stopTicking() {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

function setStatus(status) {
  state.status = status;
  counterShell.dataset.status = status;
}

function scheduleTick() {
  stopTicking();
  state.rafId = requestAnimationFrame(runTick);
}

function runTick(now) {
  if (state.status !== "running") return;
  const remainingMs = state.targetTimeMs - now;
  const nextSeconds = sanitizeDuration(Math.ceil(remainingMs / 1000), {
    minSeconds: 0,
  });

  if (nextSeconds !== state.totalSeconds) {
    state.totalSeconds = nextSeconds;
    renderTimer(state.totalSeconds);
    const envelope = computeFinaleEnvelope(state.totalSeconds);
    if (envelope.isFinale) {
      triggerBeep(envelope);
      display.setAttribute(
        "aria-label",
        `Loppuun ${state.totalSeconds} sekuntia`,
      );
    }
  }

  if (remainingMs <= 0 || state.totalSeconds === 0) {
    state.totalSeconds = 0;
    renderTimer(0);
    setStatus("finished");
    activateFinale();
    return;
  }

  scheduleTick();
}

function startCountdown() {
  if (state.status === "running") {
    logEvent("ignored-start", { reason: "already-running" });
    return;
  }
  setStatus("running");
  startBtn.textContent = "Käynnissä";
  toggleControlsDisabled(true);
  state.targetTimeMs = performance.now() + state.totalSeconds * 1000;
  renderTimer(state.totalSeconds);
  logEvent("start", { totalSeconds: state.totalSeconds });
  scheduleTick();
}

function resetCountdown() {
  stopTicking();
  setStatus("idle");
  state.totalSeconds = DEFAULT_DURATION_SECONDS;
  state.targetTimeMs = null;
  startBtn.textContent = "Käynnistä";
  display.setAttribute("aria-label", "Valmis");
  toggleControlsDisabled(false);
  renderTimer(state.totalSeconds);
  resetFinale();
  logEvent("reset", { totalSeconds: state.totalSeconds });
}

function adjustHandler(event) {
  const { adjust } = event.currentTarget.dataset;
  if (!adjust) return;
  if (state.status === "running") {
    logEvent("ignored-adjustment", { reason: "running", action: adjust });
    return;
  }
  const delta =
    adjust === "minute-increase"
      ? 60
      : adjust === "minute-decrease"
        ? -60
        : adjust === "second-increase"
          ? 5
          : adjust === "second-decrease"
            ? -5
            : 0;

  const updated = adjustDuration(state.totalSeconds, delta, constraints);
  if (updated === state.totalSeconds) {
    logEvent("noop-adjustment", { action: adjust });
    return;
  }
  state.totalSeconds = updated;
  renderTimer(state.totalSeconds);
  logEvent("adjust", { action: adjust, totalSeconds: state.totalSeconds });
}

function init() {
  setStatus("idle");
  display.setAttribute("aria-valuemax", String(constraints.maxSeconds));
  renderTimer(state.totalSeconds);
  startBtn.addEventListener("click", startCountdown);
  resetBtn.addEventListener("click", resetCountdown);
  adjustButtons.forEach((button) => {
    button.addEventListener("click", adjustHandler);
  });
  startBtn.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      startCountdown();
    }
  });
  resetBtn.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      resetCountdown();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.status === "running") {
      state.targetTimeMs = performance.now() + state.totalSeconds * 1000;
    }
  });
  logEvent("ready", { totalSeconds: state.totalSeconds });
}

init();
