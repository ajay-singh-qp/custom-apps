import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import * as ResizeObserverModule from "resize-observer-polyfill";
import { afterEach, beforeAll, beforeEach } from "vitest";

// jsdom does not ship matchMedia; wick-ui's WuSidebar uses it internally
// through its Shadcn `useIsMobile` hook. Defined as a plain function (NOT
// `vi.fn()`) so `vi.restoreAllMocks()` inside a test can't strip it.
const installMatchMediaPolyfill = (): void => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => {},
      removeListener: (): void => {},
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      dispatchEvent: (): boolean => true,
    }),
  });
};

// Specs that opt into `@vitest-environment node` (server rendering) have no
// DOM: skip the browser polyfills there.
const hasDom = (): boolean => typeof window !== "undefined";

beforeAll(() => {
  if (!hasDom()) return;
  // https://stackoverflow.com/a/72543616/8596140
  // Required by wick-ui-lib WuModal and other Radix-based primitives.
  window.ResizeObserver = ResizeObserverModule.default;
  HTMLElement.prototype.scrollIntoView = (): void => {};
  // Radix (used by wick-ui's Toast / Chip primitives) reads pointer-capture
  // APIs during PointerEvent handling; jsdom doesn't ship these.
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = (): boolean => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = (): void => {};
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = (): void => {};
  }
  installMatchMediaPolyfill();
});

beforeEach(() => {
  if (!hasDom()) return;
  // Re-install in case a test's vi.restoreAllMocks() stripped the polyfill.
  installMatchMediaPolyfill();
});

afterEach(() => {
  if (!hasDom()) return;
  cleanup();
});
