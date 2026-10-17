import assert from 'node:assert/strict';
import test from 'node:test';

import { getActiveTabStreamId } from '../src/capture/tab-capture.ts';

test('stream ID helper returns the ID acquired by the browser adapter', async () => {
  const streamId = await getActiveTabStreamId({
    getMediaStreamId: async () => 'stream-123',
  });

  assert.equal(streamId, 'stream-123');
});

test('empty tab stream id produces a useful capture error', async () => {
  await assert.rejects(
    getActiveTabStreamId({ getMediaStreamId: async () => '' }),
    /active tab could not be captured/i,
  );
});

test('missing activeTab grant explains how to invoke capture for the Meet tab', async () => {
  await assert.rejects(
    getActiveTabStreamId({
      getMediaStreamId: async () => {
        throw new Error('Extension has not been invoked for the current page (see activeTab permission). Chrome pages cannot be captured.');
      },
    }),
    /click the MeetingMind toolbar icon while the Google Meet tab is active/i,
  );
});
