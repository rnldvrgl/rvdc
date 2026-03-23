import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RVDC Ref and Aircon Repair Shop",
    short_name: "RVDC",
    description:
      "Professional refrigerator and air conditioning repair services management system.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#7f22fe",
    orientation: "any",
    icons: [
      {
        src: "/rvdc_logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/rvdc_logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
