import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/bungee/400.css";
import "./globals.css";
import { StoreHydrator } from "@/components/ui/StoreHydrator";
import { SettingsApplier } from "@/components/ui/SettingsApplier";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ToastHost } from "@/components/ui/Toast";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { AuthSync } from "@/components/AuthSync";
import { AgeGateOverlay } from "@/components/AgeGateOverlay";

export const metadata: Metadata = {
  title: "tag.ai, the barkada drinking game",
  description:
    "Pass the phone, answer the card, take the shot. A drinking game built for Filipino barkadas.",
  applicationName: "tag.ai",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "tag.ai", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#181310",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreHydrator />
        <AuthSync />
        <SettingsApplier />
        <MotionProvider><div className="mx-auto min-h-dvh w-full max-w-md">{children}</div></MotionProvider>
        {/* iPhone: the status bar is see-through in the installed app, so cover it with the page colour while content scrolls under it. */}
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-bg" style={{ height: 'env(safe-area-inset-top)' }} />
        <AgeGateOverlay />
        <OfflineBanner />
        <ToastHost />
      </body>
    </html>
  );
}
