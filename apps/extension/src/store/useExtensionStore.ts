import { create } from 'zustand';

export type ExtensionState = 'disconnected' | 'no_meeting' | 'detected' | 'recording';

interface TranscriptSnippet {
  id: string;
  speaker: string;
  text: string;
  isFinal: boolean;
}

interface ExtensionStore {
  state: ExtensionState;
  workspaceName: string;
  meetingTitle: string | null;
  elapsedSeconds: number;
  transcript: TranscriptSnippet[];
  isPaused: boolean;
  errorMessage: string | null;
  
  setState: (state: ExtensionState) => void;
  setWorkspaceName: (name: string) => void;
  setMeetingTitle: (title: string | null) => void;
  tickElapsed: () => void;
  resetElapsed: () => void;
  addTranscriptSnippet: (snippet: TranscriptSnippet) => void;
  clearTranscript: () => void;
  setPaused: (paused: boolean) => void;
  setErrorMessage: (message: string | null) => void;
}

export const useExtensionStore = create<ExtensionStore>((set) => ({
  state: 'disconnected', // Default to disconnected initially
  workspaceName: 'Engineering Workspace',
  meetingTitle: null,
  elapsedSeconds: 0,
  transcript: [],
  isPaused: false,
  errorMessage: null,

  setState: (state) => set({ state }),
  setWorkspaceName: (workspaceName) => set({ workspaceName }),
  setMeetingTitle: (meetingTitle) => set({ meetingTitle }),
  tickElapsed: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  resetElapsed: () => set({ elapsedSeconds: 0 }),
  addTranscriptSnippet: (snippet) => set((s) => {
    // If it's a final snippet and matches the last interim, replace it
    const last = s.transcript[s.transcript.length - 1];
    if (last && !last.isFinal && last.speaker === snippet.speaker) {
      return { transcript: [...s.transcript.slice(0, -1), snippet] };
    }
    return { transcript: [...s.transcript, snippet] };
  }),
  clearTranscript: () => set({ transcript: [] }),
  setPaused: (isPaused) => set({ isPaused }),
  setErrorMessage: (errorMessage) => set({ errorMessage })
}));
