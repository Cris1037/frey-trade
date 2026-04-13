import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "./_utils/theme-context";

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
  icons: {
    icon: [{ url: "/assets/3384357_57661.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){var t=localStorage.getItem('ft-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();`
        }} />
      </head>
      <body className={`${afacad.variable} ${raleway.variable} min-h-screen antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
