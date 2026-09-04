import { renderHook } from "@testing-library/react";
import { usePipelineEvents } from "./use-pipeline-events";

describe("usePipelineEvents", () => {
  it("should initialize with disconnected state", () => {
    const { result } = renderHook(() =>
      usePipelineEvents({
        workspaceId: "test-ws",
        meetingId: "test-meeting",
        enabled: false,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastEvent).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not connect when enabled is false", () => {
    const { result } = renderHook(() =>
      usePipelineEvents({
        workspaceId: "test-ws",
        meetingId: "test-meeting",
        enabled: false,
      })
    );

    expect(result.current.isConnected).toBe(false);
  });

  it("should provide reconnect function", () => {
    const { result } = renderHook(() =>
      usePipelineEvents({
        workspaceId: "test-ws",
        meetingId: "test-meeting",
        enabled: false,
      })
    );

    expect(typeof result.current.reconnect).toBe("function");
  });
});
