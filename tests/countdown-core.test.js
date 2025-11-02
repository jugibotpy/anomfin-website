// Cybersecurity meets clarity.
import { describe, expect, it } from "vitest";
import {
  DEFAULT_DURATION_SECONDS,
  adjustDuration,
  computeFinaleEnvelope,
  deriveTimeParts,
  formatTime,
  sanitizeDuration,
  toTotalSeconds,
} from "../js/modules/countdown-core.js";

describe("countdown-core", () => {
  it("sanitizes invalid inputs by clamping to bounds", () => {
    expect(sanitizeDuration("nan", { minSeconds: 30, maxSeconds: 90 })).toBe(
      30,
    );
    expect(sanitizeDuration(150, { minSeconds: 30, maxSeconds: 90 })).toBe(90);
    expect(sanitizeDuration(-40)).toBe(10);
  });

  it("adjusts duration while respecting bounds", () => {
    expect(adjustDuration(120, 60, { maxSeconds: 240 })).toBe(180);
    expect(adjustDuration(120, -200, { minSeconds: 30 })).toBe(30);
    expect(adjustDuration(120, "abc")).toBe(120);
  });

  it("derives formatted time segments accurately", () => {
    expect(deriveTimeParts(DEFAULT_DURATION_SECONDS)).toEqual({
      minutes: 30,
      seconds: 0,
    });
    expect(formatTime(65)).toBe("01:05");
  });

  it("converts minutes and seconds objects to total seconds", () => {
    expect(toTotalSeconds({ minutes: 1, seconds: 30 })).toBe(90);
    expect(toTotalSeconds({ minutes: -1, seconds: 5 })).toBe(10);
  });

  it("computes finale envelope with progressive intensity", () => {
    const envelope = computeFinaleEnvelope(5, 10);
    expect(envelope.isFinale).toBe(true);
    expect(envelope.intensity).toBeCloseTo(0.5, 2);
    expect(envelope.frequencyHz).toBeGreaterThan(520);
    expect(envelope.pulseMs).toBeLessThan(420);
  });

  it("treats durations outside the finale window as inactive", () => {
    const envelope = computeFinaleEnvelope(25, 10);
    expect(envelope).toEqual({
      isFinale: false,
      intensity: 0,
      frequencyHz: 0,
      pulseMs: 0,
    });
  });
});
