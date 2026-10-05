import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SwingMeter from "./SwingMeter";

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe("SwingMeter", () => {
  it("swings from the centre when nothing has moved yet", async () => {
    const onSwing = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SwingMeter onSwing={onSwing} />);
    await user.click(screen.getByRole("button", { name: "Swing" }));
    expect(onSwing).toHaveBeenCalledTimes(1);
    expect(onSwing.mock.calls[0][0]).toBeCloseTo(0.5, 1);
  });

  it("moves the marker over time, staying within 0 to 1", async () => {
    const onSwing = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SwingMeter onSwing={onSwing} />);
    await advance(300);
    await user.click(screen.getByRole("button", { name: "Swing" }));
    const position = onSwing.mock.calls[0][0] as number;
    expect(position).toBeGreaterThan(0.55);
    expect(position).toBeLessThanOrEqual(1);
  });

  it("freezes the marker after a swing", async () => {
    const onSwing = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SwingMeter onSwing={onSwing} />);
    await advance(200);
    await user.click(screen.getByRole("button", { name: "Swing" }));
    await advance(500);
    await user.click(screen.getByRole("button", { name: "Swing" }));
    expect(onSwing.mock.calls[1][0]).toBe(onSwing.mock.calls[0][0]);
  });

  it("swings on Space and on Enter, using the custom label", async () => {
    const onSwing = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SwingMeter onSwing={onSwing} actionLabel="Putt" />);
    expect(screen.getByText("Press Space or Enter to putt")).toBeInTheDocument();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onSwing).toHaveBeenCalledTimes(2);
  });

  it("is inert while the ball is in flight", async () => {
    const onSwing = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SwingMeter onSwing={onSwing} disabled />);
    expect(screen.getByRole("button", { name: "Ball in flight" })).toBeDisabled();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(onSwing).not.toHaveBeenCalled();
  });

  it("stops its animation loop when unmounted", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<SwingMeter onSwing={vi.fn()} />);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
