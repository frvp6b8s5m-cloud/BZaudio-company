import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LevelMeter } from "./LevelMeter";
import { SpectrumBars } from "./SpectrumBars";
import { ToolPanel } from "./ToolPanel";

describe("shared tool components", () => {
  it("provides a labelled region for each tool", () => {
    render(
      <ToolPanel title="RTA" description="Real-time frequency analysis.">
        <p>Analyzer content</p>
      </ToolPanel>,
    );

    expect(screen.getByRole("region", { name: "RTA" })).toBeInTheDocument();
    expect(screen.getByText("Real-time frequency analysis.")).toBeInTheDocument();
    expect(screen.getByText("Analyzer content")).toBeInTheDocument();
  });

  it("exposes the numeric level and range to assistive technology", () => {
    render(<LevelMeter label="Main output" valueDbfs={-12.3} peakDbfs={-3} />);

    const meter = screen.getByRole("meter", { name: "Main output" });
    expect(meter).toHaveAttribute("aria-valuemin", "-60");
    expect(meter).toHaveAttribute("aria-valuemax", "0");
    expect(meter).toHaveAttribute("aria-valuenow", "-12.3");
    expect(screen.getByText("-12.3 dBFS")).toBeInTheDocument();
    expect(screen.getByText("Peak -3.0 dBFS")).toBeInTheDocument();
  });

  it("shows a no-signal state for non-finite meter readings", () => {
    render(<LevelMeter label="Input" valueDbfs={Number.NaN} />);

    expect(screen.getByRole("meter", { name: "Input" })).toHaveAttribute(
      "aria-valuetext",
      "No signal",
    );
    expect(screen.getByText("No signal")).toBeInTheDocument();
  });

  it("describes spectrum bins without relying on color alone", () => {
    render(<SpectrumBars label="Live spectrum" bins={[0.2, 0.8, 0.4]} />);

    expect(screen.getByRole("img", { name: "Live spectrum" })).toBeInTheDocument();
    expect(screen.getByText("3 bands · peak 80%")).toBeInTheDocument();
  });

  it("provides an empty state when no spectrum data is available", () => {
    render(<SpectrumBars label="Live spectrum" bins={[]} />);

    expect(screen.getByText("Waiting for spectrum data")).toBeInTheDocument();
  });
});
