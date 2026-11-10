import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("BZaudio home page", () => {
  it("introduces the live sound toolbox and its primary navigation", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /tools built for the show/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Toolbox$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Admin$/i })).toHaveAttribute("href", "#admin");
    expect(screen.getByText(/Created by/i)).toBeInTheDocument();
    expect(document.getElementById("home")).toBeInTheDocument();
    expect(document.getElementById("toolbox")).toBeInTheDocument();
    expect(document.getElementById("approach")).toBeInTheDocument();
    expect(document.getElementById("about")).toBeInTheDocument();
    expect(document.getElementById("admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open project repository/i })).toHaveAttribute(
      "href",
      "https://github.com/frvp6b8s5m-cloud/BZaudio-company",
    );
  });
});
