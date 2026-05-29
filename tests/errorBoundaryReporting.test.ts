// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const beginPlaidSessionMock = vi.hoisted(() => vi.fn(() => "deadbeef-1111-4222-8333-444455556666"));
const logPlaidEventMock = vi.hoisted(() => vi.fn());

vi.mock("../src/services/plaid/plaidDiagnostics", () => ({
  beginPlaidSession: beginPlaidSessionMock,
  logPlaidEvent: logPlaidEventMock,
}));

import ErrorBoundary from "../src/components/ErrorBoundary";

const Crash = () => {
  throw new Error("synthetic FL crash");
};

describe("ErrorBoundary diagnostics reporting", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    beginPlaidSessionMock.mockClear();
    beginPlaidSessionMock.mockReturnValue("deadbeef-1111-4222-8333-444455556666");
    logPlaidEventMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("forwards thrown errors to logPlaidEvent and renders a copy-friendly diagnostic id", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(Crash),
        ),
      );
    });

    // It captured one logger call for the uncaught render error.
    const calls = logPlaidEventMock.mock.calls.filter(
      (call) => call[0] === "uncaught_react_error",
    );
    expect(calls).toHaveLength(1);
    const payload = calls[0][1] as {
      errorDetails?: { message?: string };
      pageState?: { pathname?: string };
    };
    expect(payload.errorDetails?.message).toContain("synthetic FL crash");
    expect(payload.pageState?.pathname).toBeDefined();

    // The diagnostic id surfaces in the fallback UI so support can grep it.
    const idNode = container.querySelector("[data-testid='error-diagnostic-id']");
    expect(idNode?.textContent).toBe("deadbeef-1111-4222-8333-444455556666");
  });

  it("never re-throws when beginPlaidSession fails", async () => {
    beginPlaidSessionMock.mockImplementationOnce(() => {
      throw new Error("sessionStorage blocked");
    });

    await act(async () => {
      root.render(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(Crash),
        ),
      );
    });

    // Fallback still rendered, no second render-time crash.
    const heading = container.querySelector("h1");
    expect(heading?.textContent).toBe("Something went wrong");
    // Diagnostic id chip is omitted when no session could be derived.
    const idNode = container.querySelector("[data-testid='error-diagnostic-id']");
    expect(idNode).toBeNull();
  });

  it("never re-throws when logPlaidEvent itself throws", async () => {
    logPlaidEventMock.mockImplementationOnce(() => {
      throw new Error("diagnostics endpoint exploded");
    });

    await act(async () => {
      root.render(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(Crash),
        ),
      );
    });

    const heading = container.querySelector("h1");
    expect(heading?.textContent).toBe("Something went wrong");
  });
});
