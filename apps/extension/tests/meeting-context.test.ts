import assert from 'node:assert/strict';
import test from 'node:test';

import { extractVisibleParticipants } from '../src/capture/meeting-context.ts';

interface ParticipantFixture {
  attributes: Record<string, string>;
  nameText?: string;
  childName?: { attributes: Record<string, string>; text: string };
  visible: boolean;
}

function fixtureDocument(participants: ParticipantFixture[]): Pick<Document, 'querySelectorAll'> {
  return {
    querySelectorAll: (selector: string) => {
      assert.equal(selector, '[data-participant-id], [data-self-name]');
      return participants.map((participant) => ({
        getAttribute: (name: string) => participant.attributes[name] ?? null,
        hasAttribute: (name: string) => name in participant.attributes,
        innerText: participant.nameText ?? '',
        querySelector: (childSelector: string) => {
          assert.equal(childSelector, '[data-self-name]');
          return participant.childName ? {
            getAttribute: (name: string) => participant.childName?.attributes[name] ?? null,
            innerText: participant.childName.text,
          } : null;
        },
        getClientRects: () => participant.visible ? [{} as DOMRect] : [],
      } as HTMLElement));
    },
  };
}

test('extracts visible Google Meet names from participant attributes and accessible labels', () => {
  const document = fixtureDocument([
    { attributes: { 'data-self-name': 'Maya Chen', 'data-participant-id': 'p1' }, visible: true },
    { attributes: { 'data-self-name': 'Maya Chen' }, visible: true },
    { attributes: { 'aria-label': 'Ravi Shah', 'data-participant-id': 'p2' }, visible: true },
    { attributes: { 'data-participant-id': 'p3' }, childName: { attributes: { 'data-self-name': '' }, text: 'Asha Patel' }, visible: true },
    { attributes: { 'data-self-name': 'Maya Chen', 'data-participant-id': 'p1' }, visible: true },
    { attributes: { 'data-self-name': 'Hidden guest', 'data-participant-id': 'p4' }, visible: false },
    { attributes: { 'data-self-name': '   ', 'data-participant-id': 'p5' }, visible: true },
  ]);

  assert.deepEqual(extractVisibleParticipants(document), [
    { display_name: 'Maya Chen', source_id: 'p1' },
    { display_name: 'Ravi Shah', source_id: 'p2' },
    { display_name: 'Asha Patel', source_id: 'p3' },
  ]);
});

test('returns empty participant context when Google Meet exposes none', () => {
  assert.deepEqual(extractVisibleParticipants(fixtureDocument([])), []);
});
