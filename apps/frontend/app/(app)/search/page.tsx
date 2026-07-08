import type { Metadata } from "next";
import SearchClient from "./_components/search-client";

export const metadata: Metadata = { title: "Ask AI" };

export default function SearchPage() {
  return <SearchClient />;
}
