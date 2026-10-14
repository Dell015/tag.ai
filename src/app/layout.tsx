import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { StoreHydrator } from "@/components/ui/StoreHydrator";
import { ToastHost } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "tag.ai, the barkada drinking game",
  description:
    "Pass the phone, answer the card, take the shot. A drinking game built for Filipino barkadas.",
  applicationName: "tag.ai",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "tag.ai", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#181310",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreHydrator />
        <div className="mx-auto min-h-dvh w-full max-w-md">{children}</div>
        <ToastHost />
      </body>
    </html>
  );
}
