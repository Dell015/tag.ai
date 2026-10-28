import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play TagAi with me",
  description: "Join with this link and we both get coins.",
  openGraph: { title: "You are invited to a TagAi game", description: "Open the link, sign in and join the room.", images: [{ url: "/og-invite.png", width: 1200, height: 630, alt: "You are invited to a TagAi game" }] },
  twitter: { card: "summary_large_image", title: "You are invited to a TagAi game", images: ["/og-invite.png"] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
