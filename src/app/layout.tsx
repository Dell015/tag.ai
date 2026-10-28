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
import { BrandIntro } from "@/components/brand/BrandIntro";

export const metadata: Metadata = {
  title: "TagAi, the barkada drinking game",
  description:
    "Take the card or take the shot. A drinking game built for Filipino barkadas.",
  applicationName: "TagAi",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "tag.ai", statusBarStyle: "black" },
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
        <MotionProvider><div className="mx-auto min-h-dvh w-full">{children}</div></MotionProvider>
        <AgeGateOverlay />
        <BrandIntro />
        <OfflineBanner />
        <ToastHost />
      </body>
    </html>
  );
}
