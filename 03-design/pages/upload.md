---
Title: MeetingMind — Upload Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 01-product/functional-requirements.md
---

# MeetingMind — Upload Page (`/meetings/upload`)

The Upload page is the ingestion point for all meeting data. It requires a flawless UX to prevent user frustration when handling large files.

## 1. Page Purpose
To allow users to select media files, attach metadata, and initiate the processing pipeline securely.

## 2. Layout Structure

* **Page Container:** Centered, `max-w-2xl` card to keep focus tight.
* **Header:** "Upload a Meeting".
* **Step 1: The Dropzone (Active first)**
  * A large dashed border area.
  * Icon: `UploadCloud` (large).
  * Text: "Drag and drop your audio or video file here".
  * Subtext: "Supported: MP4, MP3, WAV, WebM (Max 2GB)".
* **Step 2: Metadata Form (Hidden until file selected)**
  * File Preview (Name, Size, format icon).
  * Meeting Title (Auto-filled with filename, editable).
  * Meeting Date (Defaults to today).
  * Participants (Optional tags).
  * "Start Processing" Button (Primary).

## 3. Interaction Design & States

### 3.1 Selection State
* **Hover (Drag over):** The Dropzone border turns solid primary, background becomes `bg-primary/10`, icon animates slightly upward.
* **Invalid File:** Dropzone border turns `border-destructive`. Toast appears explaining the error (e.g., "File exceeds 2GB limit").

### 3.2 Metadata State
* Once a valid file is dropped, the large Dropzone collapses to a smaller File Preview banner.
* The Metadata form slides down (`framer-motion` height animation).
* Focus automatically shifts to the "Meeting Title" input.

### 3.3 Uploading State (Crucial)
When the user clicks "Start Processing":
1. All inputs are disabled.
2. The "Start Processing" button turns into a Progress Bar.
3. **Progress Bar:** Real-time percentage tracking the MinIO PUT request.
4. **Completion:** Upon reaching 100%, the UI transitions to a Success State with a checkmark, then automatically redirects the user to the Meeting Details page (which will be in a "Processing" state).

## 4. Technical Design Notes
* Because files can be up to 2GB, we CANNOT read the file into browser memory as a DataURI.
* The form must utilize React Hook Form, but the file object itself should be held in a local ref or state, passed directly to the Axios `put` request using the presigned URL retrieved from the backend.
* Use `axios.request` with the `onUploadProgress` callback to drive the progress bar state.
