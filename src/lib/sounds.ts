"use client";

type SoundType = "activate" | "process" | "success" | "error" | "click" | "toggle" | "send" | "complete" | "delete" | "notify";

export function playSound(type: SoundType) {
  if (typeof window === "undefined") return;
  // Check if sounds enabled
  if (localStorage.getItem("kron-sounds") === "false") return;

  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.08;

    switch (type) {
      case "activate":
        // Rising double beep - wake word / mode on
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
        break;

      case "success":
      case "complete":
        // Happy ascending 3-tone - event created, task done
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.setValueAtTime(700, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start(); osc.stop(ctx.currentTime + 0.28);
        break;

      case "send":
      case "process":
        // Whoosh - sending message / AI thinking
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        break;

      case "error":
        // Low buzz
        osc.frequency.value = 200;
        osc.type = "square";
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        break;

      case "click":
      case "toggle":
        // Short tick
        osc.frequency.value = 800;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start(); osc.stop(ctx.currentTime + 0.04);
        break;

      case "delete":
        // Descending - removed something
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(); osc.stop(ctx.currentTime + 0.18);
        break;

      case "notify":
        // Gentle ding - notification
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
        break;
    }
  } catch {}
}
