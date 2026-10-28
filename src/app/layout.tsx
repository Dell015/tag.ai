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
import { SwRegister } from "@/components/ui/SwRegister";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "TagAi, the barkada drinking game",
  description:
    "Take the card or take the shot. A drinking game built for Filipino barkadas.",
  applicationName: "TagAi",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "TagAi", statusBarStyle: "black" },
  openGraph: {
    type: "website", siteName: "TagAi", title: "TagAi, take the card or take the shot",
    description: "The drinking game for Filipino barkadas.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TagAi, take the card or take the shot" }],
  },
  twitter: { card: "summary_large_image", title: "TagAi, take the card or take the shot", images: ["/og.png"] },
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
        <SwRegister />
        <ToastHost />
      </body>
    </html>
  );
}
