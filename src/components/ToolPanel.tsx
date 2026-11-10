import { useId, type ReactNode } from "react";
import "./tooling.css";

interface ToolPanelProps {
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
}

export function ToolPanel({
  title,
  description,
  eyebrow = "BZAUDIO TOOL",
  children,
}: ToolPanelProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      className="tool-panel"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="tool-panel__header">
        <span className="tool-panel__eyebrow">{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
      </header>
      <div className="tool-panel__content">{children}</div>
    </section>
  );
}
