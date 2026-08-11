import type { Metadata } from "next";
import ImportClient from "./_components/import-client";

export const metadata: Metadata = {
  title: "Import Recording",
};

export default function ImportRecordingPage() {
  return <ImportClient />;
}
