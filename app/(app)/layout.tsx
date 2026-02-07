import { ThemeProvider } from "next-themes";
import { AppNavbar } from "@/components/app-navbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-pulse-bg">
        <AppNavbar />
        {children}
      </div>
    </ThemeProvider>
  );
}
