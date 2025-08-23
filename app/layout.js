import './globals.css'
import 'leaflet/dist/leaflet.css'

export const metadata = {
  title: 'Mapa de Proyectos Forestales de España',
  description: 'Explora proyectos forestales y sus créditos de carbono en España',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}