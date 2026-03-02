import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Trimly",
  description: "High Tech Salon Management App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
