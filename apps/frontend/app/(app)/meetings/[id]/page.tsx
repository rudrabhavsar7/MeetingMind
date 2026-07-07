import type { Metadata } from "next";
import MeetingDetailClient from "./_components/meeting-detail-client";

export const metadata: Metadata = { title: "Meeting Details" };

export default function MeetingDetailPage() {
  return <MeetingDetailClient />;
}
