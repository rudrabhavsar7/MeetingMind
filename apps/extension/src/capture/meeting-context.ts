export interface VisibleParticipantContext {
  display_name: string;
  source_id: string | null;
}

export interface GoogleMeetPageContext {
  title: string | null;
  visible_participants: VisibleParticipantContext[];
}

const PARTICIPANT_SELECTOR = '[data-participant-id], [data-self-name]';
const MAX_VISIBLE_PARTICIPANTS = 100;
const MAX_PARTICIPANT_NAME_LENGTH = 255;

export function extractVisibleParticipants(
  document: Pick<Document, 'querySelectorAll'>,
): VisibleParticipantContext[] {
  const participants: VisibleParticipantContext[] = [];
  const seenIds = new Set<string>();
  const identifiedNames = new Set<string>();
  const unidentifiedNames = new Map<string, number>();

  for (const element of document.querySelectorAll<HTMLElement>(PARTICIPANT_SELECTOR)) {
    if (element.getClientRects().length === 0) continue;

    const nameElement = element.hasAttribute('data-self-name') ? element : element.querySelector<HTMLElement>('[data-self-name]');
    const displayName = (
      nameElement?.getAttribute('data-self-name')?.trim()
      || nameElement?.innerText.trim()
      || element.getAttribute('aria-label')?.trim()
      || ''
    )
      .slice(0, MAX_PARTICIPANT_NAME_LENGTH);
    if (!displayName) continue;

    const sourceId = element.getAttribute('data-participant-id')?.trim().slice(0, 255) || null;
    const normalizedName = displayName.toLocaleLowerCase();
    if (sourceId) {
      if (seenIds.has(sourceId)) continue;
      seenIds.add(sourceId);
      const unidentifiedIndex = unidentifiedNames.get(normalizedName);
      if (unidentifiedIndex !== undefined) {
        participants[unidentifiedIndex].source_id = sourceId;
        unidentifiedNames.delete(normalizedName);
        identifiedNames.add(normalizedName);
        continue;
      }
      identifiedNames.add(normalizedName);
    } else {
      if (identifiedNames.has(normalizedName) || unidentifiedNames.has(normalizedName)) continue;
      unidentifiedNames.set(normalizedName, participants.length);
    }

    participants.push({ display_name: displayName, source_id: sourceId });
    if (participants.length >= MAX_VISIBLE_PARTICIPANTS) break;
  }

  return participants;
}

export function readGoogleMeetPageContext(document: Document): GoogleMeetPageContext {
  const title = document.querySelector<HTMLElement>('[data-meeting-title]')?.innerText.trim()
    || document.title.trim()
    || null;
  return { title, visible_participants: extractVisibleParticipants(document) };
}
