---
Title: MeetingMind — Testing: End-to-End (E2E) Testing
Version: 2.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-07-11
Dependencies: 06-testing/testing-strategy.md, 01-product/requirements-traceability.md, 04-backend/realtime-protocol.md
---

# MeetingMind Testing: End-to-End Testing

## 1. Environment and Principles

Use Playwright against the isolated staging application with synthetic meeting fixtures, local models/provider fakes, independent secrets/storage, and the Supabase PostgreSQL `meetingmind_staging` schema. Tests must not use the development schema, call any other Supabase service, call external AI/telemetry/email services, or reuse production data.

Browser-console tests and packaged-extension tests are separate projects. Chrome extension capture requires persistent Chromium context with the built unpacked MV3 extension and a controlled fake meeting page/audio fixture; it cannot be accurately simulated by clicking a web-console button in an ordinary page fixture.

## 2. v1 Release Journeys

1. First-run Owner/workspace bootstrap, then invitation-only registration and login/logout/reset.
2. Extension connect, Google Meet detection, explicit tab-audio capture, live transcript, Pause/Resume, reconnect, stop, cited final outputs.
3. Standalone `/meetings/new` microphone fallback using the same protocol, including permission denial and device loss.
4. Recording import through MinIO signed upload and idempotent batch completion.
5. Meeting detail: cited summary/version history, action/decision, transcript speaker rename, and conditional retained-media timestamp seek.
6. Workspace Actions filters/edit/citation navigation.
7. Keyword search and Ask AI as visibly distinct modes, both workspace isolated; cited RAG jump target works.
8. Display-name/password management with other-session revocation.
9. Local Markdown export with expected current visible content.

The traceability IDs in `01-product/requirements-traceability.md` name the required assertions. At least one E2E or lower-level automated test must own each v1 target; edge/security cases should stay in faster integration/unit suites.

## 3. Extension Harness

- Build the extension deterministically and load it with `--disable-extensions-except`/`--load-extension` in a persistent Chromium context.
- Serve an operator-controlled Google Meet-like fixture page; do not automate or record real third-party meetings.
- Provide deterministic audio through an approved browser/media fixture and validate sequence/ack behavior at the backend boundary.
- Assert service-worker/offscreen ownership across popup/side-panel closure and service-worker suspension.
- Exercise disconnects shorter and longer than the 60-second replay window, fresh handshake-token renewal after 15 minutes, gaps, heartbeat timeout, and the eight-hour limit using controllable clocks where possible.
- Preserve tab playback and verify no tokens/raw audio enter page content scripts or persistent extension storage.

## 4. Locators and Data

Prefer accessible roles/names, then stable `data-testid` values where the extension shadow/surface boundary requires them. Never depend on generated CSS selectors or production hostnames. Each test creates uniquely identified synthetic workspace/meeting data and removes it through test fixtures or an isolated environment reset.

AI assertions use typed deterministic fixtures: assert schema, citations, versions, and UI behavior, not arbitrary model wording. A separate local-model evaluation suite measures output quality.

## 5. Artifacts and Privacy

Trace, screenshot, and video artifacts are enabled on failure but contain synthetic data only. Redact bearer/stream tokens, cookies, signed URLs, and secret-bearing request headers. Apply short CI artifact retention.

Run a smoke subset on every release candidate and the complete suite nightly or before release. A v1 release is blocked by failures in bootstrap/auth, workspace isolation, live capture/finalization, import, citation integrity, or default no-egress checks.
