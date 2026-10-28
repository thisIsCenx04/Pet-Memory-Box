import { Baloo_2, Be_Vietnam_Pro, Patrick_Hand } from "next/font/google";

export const baloo = Baloo_2({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-baloo",
  display: "swap",
});

export const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const patrick = Patrick_Hand({
  subsets: ["vietnamese", "latin"],
  weight: "400",
  variable: "--font-patrick",
  display: "swap",
});
