import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  outputFileTracingIncludes: {
    "/quejas/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/ac-ap/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/indicadores/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/proveedores/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/recorridos-bpa/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/ac-ap/[id]/informe/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/pnc/registro/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
    "/verificacion-sgi/exportar/pdf": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
