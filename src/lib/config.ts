/**
 * Configuración de marca del sistema.
 * Permite reutilizar el mismo código para distintos clientes/demos
 * sin tocar el código fuente — solo cambiando variables de entorno.
 *
 * En Vercel: Project Settings → Environment Variables.
 * En local: .env.local
 */
export const config = {
  empresaNombre: process.env.NEXT_PUBLIC_EMPRESA_NOMBRE || 'BONYARD Servicios',
  appNombre: process.env.NEXT_PUBLIC_APP_NOMBRE || 'SGD Bonyard',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'v1.0',
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/logo-bonyard.png',
  normas: process.env.NEXT_PUBLIC_NORMAS || 'SQF / ISO 9001:2015',
  // Útil para distinguir el entorno de pruebas del real en pantalla/logs
  esDemo: process.env.NEXT_PUBLIC_ES_DEMO === 'true',
}
