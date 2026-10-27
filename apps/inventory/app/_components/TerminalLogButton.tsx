"use client";

export function TerminalLogButton() {
  return (
    <button
      type="button"
      onClick={() => console.log("Inventory app: terminal log button clicked")}
      style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        cursor: "pointer",
        background: "#f6f8fa",
        color: "#1f2328",
      }}
    >
      Log to terminal
    </button>
  );
}
