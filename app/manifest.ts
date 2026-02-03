import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PulseMarkets — Trade Attention in Real Time",
    short_name: "PulseMarkets — Trade Attention in Real Time",
    description:
      "PulseMarkets lets users trade attention as an asset in real time, with instant execution and autonomous agent settlement on Yellow",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  };
}
