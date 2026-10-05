import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmationDialog from "./ConfirmationDialog";

const confirmation = {
  type: "shot" as const,
  title: "Good Iron",
  message: "You hit it 127 yards.",
  actionLabel: "Next shot"
};

describe("ConfirmationDialog", () => {
  it("renders nothing without a confirmation", () => {
    render(<ConfirmationDialog confirmation={null} onConfirm={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a modal dialog named by its title, with the message", () => {
    render(<ConfirmationDialog confirmation={confirmation} onConfirm={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Good Iron" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("You hit it 127 yards.")).toBeInTheDocument();
    expect(screen.getByText("Shot result")).toBeInTheDocument();
  });

  it("labels hole confirmations differently", () => {
    render(<ConfirmationDialog confirmation={{ ...confirmation, type: "hole" }} onConfirm={vi.fn()} />);
    expect(screen.getByText("Hole complete")).toBeInTheDocument();
  });

  it("calls onConfirm from the action button", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmationDialog confirmation={confirmation} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Next shot" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
