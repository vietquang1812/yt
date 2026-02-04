import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";
import BootstrapClient from "./BootstrapClient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>
        <BootstrapClient />
        {children}
      </body>
    </html>
  );
}
 