import { App } from "@/components/App";

export default function Home() {
  return <App draftPreview={process.env.NODE_ENV !== "production" && process.env.SERVE_UNAPPROVED === "true"} />;
}
