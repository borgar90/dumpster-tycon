import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { enabledAuthProviders, getServerAuthSession } from "@/auth";
import AuthScreen from "@/components/AuthScreen";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import GameBootstrap from "@/components/GameBootstrap";
import TopNav from "@/components/TopNav";
import PlayerSidebar from "@/components/PlayerSidebar";
import NotificationToasts from "@/components/NotificationToasts";
import GameRouter from "@/components/GameRouter";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const authBaseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || '';

export const metadata: Metadata = {
  title: "Dumpster Tycoon",
  description: "One man's trash is your empire.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <html lang="en" className={`${geistMono.variable} h-full`}>
      <body className="min-h-full" style={{ background: '#f8fafc', fontFamily: 'monospace' }}>
        <AuthSessionProvider session={session}>
          {session?.user ? (
            <GameBootstrap>
              <TopNav />
              <div className="flex pt-14 min-h-screen">
                <PlayerSidebar />
                <main className="flex-1 ml-52 min-h-[calc(100vh-56px)] overflow-y-auto">
                  <GameRouter />
                </main>
              </div>
              <NotificationToasts />
            </GameBootstrap>
          ) : (
            <AuthScreen enabledProviders={enabledAuthProviders} authBaseUrl={authBaseUrl} />
          )}
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
