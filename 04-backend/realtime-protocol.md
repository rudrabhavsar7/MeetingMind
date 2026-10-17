---
Title: MeetingMind - Real-Time Capture Protocol
Version: 1.0.1
Status: Approved
Owner: Lead Backend and Extension Engineers
Last Updated: 2026-10-17
Dependencies: 08-resources/decisions-log.md, 02-engineering/jira-api-contracts.md
Related Documents:
  - 03-design/pages/extension-capture.md
  - 04-backend/transcription.md
  - 01-product/security-requirements.md
---

# MeetingMind Real-Time Capture Protocol v1

## 1. Normative Scope

This document is the source of truth for live extension and standalone web capture. v1 uses WebSocket only. WebRTC is a future transport and must not be silently substituted by an implementation ticket.

Normative terms `MUST`, `SHOULD`, and `MAY` follow RFC 2119 meanings.

## 2. Chrome Manifest V3 Ownership

Minimum supported Chrome version: 116.

1. A user clicks Start Capture in the popup or side panel.
2. The service worker verifies the detected target tab, ensures one `offscreen.html` document exists with reason `USER_MEDIA`, and calls `chrome.tabCapture.getMediaStreamId({targetTabId})` within the user gesture lifecycle.
3. The service worker immediately sends the one-use stream ID to the offscreen document.
4. The offscreen document consumes it through `getUserMedia` using the tab stream ID and separately obtains the local microphone with `getUserMedia({audio: true})`; it owns both streams, AudioContext/AudioWorklet, WebSocket, heartbeat, and replay buffer. Both sources feed the AudioWorklet input.
5. Because tab capture can suppress normal tab output, the offscreen AudioContext MUST route the captured tab source to the default destination so meeting audio remains audible. The microphone source MUST NOT connect to the destination, preventing feedback. Both tracks MUST be stopped during cleanup.
6. Microphone permission is explicit and required. If microphone acquisition fails, capture MUST stop safely and the service worker MUST open the extension's permission guidance page; the UI must offer a clear retry after permission is granted.
7. Content scripts only detect supported pages and collect visible metadata. They MUST NOT receive auth tokens or raw audio.
8. The service worker and UI reflect state received from the offscreen owner. Closing the popup or side panel MUST NOT stop capture.

The toolbar action handler opens the side panel directly, without awaiting other work before `sidePanel.open()`. The toolbar invocation grants access to the selected tab; pressing Start inside a previously opened panel does not grant access to a different tab. Acquire the stream ID in the service worker with an explicit `targetTabId`, after backend session preparation and offscreen creation, and immediately send it to the offscreen owner. Do not acquire the ID in the panel or hold it across network requests: it is single-use and expires within seconds.

Required manifest permissions are `activeTab`, `tabCapture`, `offscreen`, `storage`, and the narrow backend/meeting-app host permissions required by the build. Permission rationale and store disclosures are documented before distribution.

## 3. Audio Contract

The offscreen AudioWorklet MUST produce:

- signed PCM 16-bit little-endian;
- 16,000 Hz;
- mono;
- 250-500 ms per frame, with 500 ms recommended;
- maximum PCM payload of 16,000 bytes for a 500 ms frame.

Browser-native sample rates are resampled before transmission. Clipping, resampler failure, lost input tracks, and permission revocation produce explicit error/control events.

The worklet input is a mix of the captured meeting-tab stream and the user's local microphone stream, so speech from a solo Meet user is included. The offscreen owner emits PCM-derived audio-level events for the capture UI. Input ownership and audibility are independent: only tab audio is routed to the local destination; microphone audio is never routed there.

Each WebSocket binary message is self-contained:

| Bytes | Field | Encoding |
|---|---|---|
| 0-3 | Magic | ASCII `MM01` |
| 4-7 | Sequence number | Unsigned 32-bit big-endian |
| 8-15 | Start offset in milliseconds | Unsigned 64-bit big-endian |
| 16-17 | Duration in milliseconds | Unsigned 16-bit big-endian |
| 18-19 | Flags | Unsigned 16-bit big-endian; `1` means replayed |
| 20+ | PCM payload | Signed 16-bit little-endian samples |

JSON metadata followed by an unrelated binary message is not permitted because pairing becomes ambiguous during concurrency/replay.

## 4. Authentication and Lifetime

- Extension session token: opaque, user/device/default-workspace scoped, revocable, maximum lifetime eight hours. It is stored only in `chrome.storage.local` and is never exposed to content scripts.
- Stream handshake token: opaque, user/workspace/meeting scoped, single-purpose, maximum lifetime 15 minutes.
- An accepted WebSocket remains authenticated until close; handshake-token expiry MUST NOT terminate an active socket.
- On reconnect, the extension mints a new handshake token with `POST /workspaces/{workspace_id}/meetings/{meeting_id}/stream-token` using the extension session token.
- A live meeting has a maximum duration of eight hours. The server warns at seven hours and 55 minutes and finalizes at the limit.
- Disconnecting/resetting the extension session prevents new streams and reconnects but does not erase already persisted meeting data.

## 5. Connection Handshake

Immediately after WebSocket upgrade, the client sends:

```json
{
  "type": "stream_hello",
  "protocol_version": "1.0",
  "client_instance_id": "uuid",
  "resume_from_sequence": 120,
  "audio": {
    "encoding": "pcm_s16le",
    "sample_rate_hz": 16000,
    "channels": 1,
    "recommended_chunk_ms": 500
  }
}
```

The server responds before accepting audio:

```json
{
  "type": "stream_ready",
  "protocol_version": "1.0",
  "meeting_id": "uuid",
  "highest_contiguous_sequence": 119,
  "heartbeat_interval_ms": 15000,
  "max_chunk_bytes": 16020,
  "max_session_duration_ms": 28800000
}
```

Unsupported major protocol versions close with code `4406`. Audio received before `stream_ready` is rejected.

## 6. Acknowledgement, Replay, and Backpressure

- Sequence numbers start at zero and increase by one per audio frame for the meeting/client instance.
- The server sends `audio_ack` at least once per second or every 20 frames, whichever occurs first.
- `audio_ack.highest_contiguous_sequence` means every sequence up to that value is durably accepted for ingestion/deduplication.
- The client keeps only unacknowledged audio, in memory, for at most 60 seconds. Raw replay data is never written to extension storage.
- On reconnect, the client sends the next sequence after the last acknowledged value and replays retained frames with the replay flag.
- The server deduplicates `(meeting_id, client_instance_id, sequence_number)`.
- If unacknowledged audio exceeds 60 seconds, the client drops the oldest frames and sends `audio_gap` with the missing sequence/time range. The UI must disclose that the transcript may be incomplete.
- `slow_down` tells the client that acknowledgement lag is approaching the buffer bound. The client must not grow memory without limit.

Example acknowledgement:

```json
{
  "type": "audio_ack",
  "highest_contiguous_sequence": 139,
  "received_at": "2026-07-10T09:00:30Z"
}
```

## 7. Heartbeats and Reconnection

- Either peer sends `ping` every 15 seconds of control-message inactivity; the peer returns `pong` with the same nonce.
- Missing heartbeats for 45 seconds closes the connection as recoverable.
- Reconnect uses exponential backoff with full jitter: 1, 2, 4, 8, then a maximum 15-second delay.
- A tab close, captured-track end, explicit Stop, eight-hour limit, revoked session, or failed meeting is terminal.
- Backend restart/network loss is recoverable while the extension session and meeting remain active.

## 8. Capture Controls

Client control messages:

```json
{ "type": "capture_control", "action": "pause", "at_ms": 120000 }
```

```json
{ "type": "capture_control", "action": "resume", "at_ms": 180000 }
```

- Pause stops audio-frame production but keeps the WebSocket and heartbeat active.
- Timeline offsets remain relative to meeting start, so a pause creates an intentional time gap.
- Stop uses the idempotent meeting-end REST endpoint after outstanding frames are acknowledged or a five-second flush timeout expires.

## 9. Server Event Registry

Every pipeline event contains `type`, `event_id`, `meeting_id`, `emitted_at`, and a `data` object. Event-specific fields belong inside `data`; persisted entities include their UUID and source citations.

After an authenticated pipeline event subscription starts, the server replays the meeting's persisted final transcript segments from canonical database rows before forwarding live events. Final transcript `event_id` values are stable for each stream sequence, so clients must deduplicate replay/live overlap by event ID. Interim transcript events remain ephemeral and may be missed while disconnected.

Required v1 events:

- `stream_ready`
- `audio_ack`
- `slow_down`
- `meeting_status`
- `transcript_interim`
- `transcript_final`
- `summary_updated`
- `action_item_detected`
- `decision_detected`
- `capture_paused`
- `capture_resumed`
- `meeting_completed`
- `error`

Entity and citation payloads reuse the schemas in `02-engineering/jira-api-contracts.md`. `meeting_completed` includes final status and counts; it does not imply retained audio exists.

AI summary, action-item, decision, and completion events are published only after the corresponding database transaction commits. Their payloads describe persisted entities and use stable event IDs derived from the meeting, event type, and entity UUID. Pipeline events are live notifications, not a durable event log: a disconnected client can miss them. Meeting detail must therefore refresh all meeting-derived queries on reconnect and use bounded meeting-status polling while status is `transcribed`, `analyzing`, or `summarizing`; when a terminal status is observed, it refreshes transcript, summary, action-item, and decision queries. Persisted final transcript replay remains the transcript recovery source.

## 10. Errors and Close Codes

| Code | Meaning | Recoverable |
|---|---|---|
| `4401` | Missing/invalid/expired handshake token | Mint token and retry if extension session is valid |
| `4403` | Workspace/meeting authorization denied | No |
| `4404` | Meeting missing/deleted | No |
| `4406` | Protocol version unsupported | No until client upgrade |
| `4408` | Heartbeat/handshake timeout | Yes |
| `4409` | Meeting state conflict or duplicate active producer | Conditional |
| `4413` | Frame too large or invalid audio format | No for current stream |
| `4429` | Stream/session rate limit | Retry using server delay |
| `4500` | Server failure | Yes unless meeting becomes failed |

The server sends an `error` event before closing when possible. Error payloads contain a stable code, safe user message, `recoverable`, and optional `retry_after_ms`; they never contain tokens or transcript content in logs.

## 11. Required Tests

- Chrome service-worker restart and popup/side-panel close do not stop offscreen capture.
- Tab audio remains audible locally during capture.
- Solo user speech from the local microphone and remote meeting speech from the tab both contribute to non-silent PCM frames; microphone audio is never routed to the destination.
- Microphone permission denial stops both acquired streams, opens the permission guidance page through the service worker, and allows a retry after grant.
- Audio-level UI events reflect worklet PCM levels rather than a constant placeholder.
- Resampling produces 16 kHz mono PCM within tolerance.
- Meetings continue beyond 15 minutes and reconnect using a freshly minted handshake token.
- Duplicate/replayed/out-of-order frames do not duplicate persisted transcript input.
- A 60+ second outage creates a visible `audio_gap` instead of unbounded memory.
- Pause/Resume preserves the meeting timeline and does not finalize the session.
- Invalid token, wrong workspace, oversized frame, unsupported version, revoked extension session, tab close, and eight-hour limit follow the documented close behavior.
- Every persisted AI event contains source citations and can be recovered after console reconnect.
