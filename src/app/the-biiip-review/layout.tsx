import { Bebas_Neue, Instrument_Serif } from "next/font/google";
import "./review-motion.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  style: ["normal", "italic"],
});

export default function TheBiiipReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${bebas.variable} ${instrument.variable}`}>
      {children}
    </div>
  );
}
