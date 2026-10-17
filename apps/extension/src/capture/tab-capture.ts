interface ActiveTabCaptureApi {
  getMediaStreamId: () => Promise<string>;
}

export async function getActiveTabStreamId(
  tabCapture: ActiveTabCaptureApi,
): Promise<string> {
  let streamId: string;
  try {
    streamId = await tabCapture.getMediaStreamId();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/activeTab|not been invoked|Chrome pages cannot be captured/i.test(message)) {
      throw new Error(
        'Click the MeetingMind toolbar icon while the Google Meet tab is active, then press Start Capture.',
      );
    }
    throw error;
  }

  if (!streamId) {
    throw new Error(
      'The active tab could not be captured. Reopen MeetingMind from the Meet tab and retry.',
    );
  }

  return streamId;
}
