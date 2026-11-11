import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalculatorSuite } from "./CalculatorSuite";

describe("Release 1 engineering calculators", () => {
  it("renders all seven calculator tools with labelled inputs", () => {
    render(<CalculatorSuite />);

    for (const title of [
      "Speaker delay",
      "Subwoofer alignment",
      "Crossover starting point",
      "Speaker coverage",
      "SPL and distance",
      "Decibel calculator",
      "Gain and voltage",
    ]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    }

    expect(screen.getByLabelText("Distance (m)")).toBeInTheDocument();
    expect(screen.getByLabelText("Main arrival (ms)")).toBeInTheDocument();
    expect(screen.getByLabelText("Subwoofer upper limit (Hz)")).toBeInTheDocument();
    expect(screen.getByLabelText("Horizontal angle (°)")).toBeInTheDocument();
    expect(screen.getByLabelText("Reference SPL (dB)")).toBeInTheDocument();
    expect(screen.getByLabelText("Ratio")).toBeInTheDocument();
    expect(screen.getByLabelText("Input voltage (V)")).toBeInTheDocument();
  });

  it("updates speaker delay when the distance changes", () => {
    render(<CalculatorSuite />);

    expect(screen.getByText("29.12 ms")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Distance (m)"), {
      target: { value: "20" },
    });
    expect(screen.getByText("58.24 ms")).toBeInTheDocument();
  });

  it("explains a crossover range with no overlap", () => {
    render(<CalculatorSuite />);

    fireEvent.change(screen.getByLabelText("Subwoofer upper limit (Hz)"), {
      target: { value: "70" },
    });
    expect(screen.getByText(/No overlap between the entered operating limits/i)).toBeInTheDocument();
  });

  it("shows a helpful empty result while a required field is blank", () => {
    render(<CalculatorSuite />);

    fireEvent.change(screen.getByLabelText("Distance (m)"), {
      target: { value: "" },
    });
    expect(screen.getByText("Enter valid values")).toBeInTheDocument();
  });
});
