import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.css";

export const metadata = {
  title: "Admin UI",
  description: "Bull-board admin UI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>{children}</body>
    </html>
  );
}
