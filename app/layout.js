import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata = {
  title: 'Samuhita.id - Gerbang Menuju Karir Internasional',
  description: 'Wujudkan mimpimu bekerja di luar negeri. Daftarkan diri Anda, biarkan agensi internasional menemukan Anda.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
