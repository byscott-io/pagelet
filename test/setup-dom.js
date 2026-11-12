// Browser APIs Puck's editor needs at import time, which jsdom does not have.
// Only applied in jsdom test files: Node-environment tests must keep proving
// the renderer works with no DOM at all, so nothing is defined there.
if (typeof window !== 'undefined') {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.ResizeObserver ??= NoopObserver;
  globalThis.IntersectionObserver ??= NoopObserver;
  window.matchMedia ??= () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
}
