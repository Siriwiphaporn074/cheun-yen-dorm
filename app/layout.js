import "./globals.css";

export const metadata = {
  title: "ระบบจัดการหอพัก — ชื่นเย็นแมนชั่น",
  description: "ระบบสารสนเทศเพื่อการจัดการหอพัก กรณีศึกษา หอพักชื่นเย็นแมนชั่น",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
