/**
 * App-wide config — single source of truth.
 * Easy to swap when wiring real backend.
 */
export const config = {
  appName: "HostelHub",
  appTagline: "Modern hostel management, beautifully done.",
  currency: "₹",

  // Toggle mock vs real services.
  // In Phase 2, this becomes env-driven.
  useMockData: false,

  // Simulated network latency for mock services (ms).
  mockLatency: { min: 200, max: 600 },
} as const;
