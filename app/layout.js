import localFont from "next/font/local";
import "./globals.css";

const afacad = localFont({
  src: "../public/assets/fonts/Afacad-Regular.ttf",
  variable: "--font-afacad",
});

const raleway = localFont({
  src: "../public/assets/fonts/Raleway-VariableFont_wght.ttf",
  variable: "--font-raleway",
  weight: "100 900",
});

export const metadata = {
  title: "Frey Trade",
  description: "Modern stock trading platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${afacad.variable} ${raleway.variable} bg-[#060B18] min-h-screen text-[#E2E8F0] antialiased`}>
        {children}
      </body>
    </html>
  );
}
