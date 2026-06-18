import blackVirusSrc  from "../../object/black.png";
import blueVirusSrc   from "../../object/blue.png";
import redVirusSrc    from "../../object/red.png";
import yellowVirusSrc from "../../object/yellow.png";
import yellowCardSrc from "../../object/infection card/yellowcard.png";
import blueCardSrc   from "../../object/infection card/bluecard.png";
import redCardSrc    from "../../object/infection card/redcard.png";
import blackCardSrc  from "../../object/infection card/blackcard.png";
import type { City } from "./cities";

// [col, row] indices into blackcard.png (3 cols × 4 rows)
const BLACK_SPRITE: Record<string, [number, number]> = {
  "riyadh":   [0, 0], "tehran":  [1, 0], "kolkata":  [2, 0],
  "mumbai":   [0, 1], "chennai": [1, 1], "delhi":    [2, 1],
  "baghdad":  [0, 2], "karachi": [1, 2], "istanbul": [2, 2],
  "moscow":   [0, 3], "algiers": [1, 3], "cairo":    [2, 3],
};

// [col, row] indices into redcard.png (3 cols × 4 rows)
const RED_SPRITE: Record<string, [number, number]> = {
  "tokyo":           [0, 0], "osaka":         [1, 0], "seoul":    [2, 0],
  "beijing":         [0, 1], "shanghai":      [1, 1], "taipei":   [2, 1],
  "hong-kong":       [0, 2], "bangkok":       [1, 2], "ho-chi-minh-city": [2, 2],
  "manila":          [0, 3], "jakarta":       [1, 3], "sydney":   [2, 3],
};

// [col, row] indices into bluecard.png (3 cols × 4 rows)
const BLUE_SPRITE: Record<string, [number, number]> = {
  "montreal":      [0, 0], "atlanta":       [1, 0], "san-francisco": [2, 0],
  "chicago":       [0, 1], "new-york":      [1, 1], "washington":    [2, 1],
  "london":        [0, 2], "paris":         [1, 2], "madrid":        [2, 2],
  "milan":         [0, 3], "st-petersburg": [1, 3], "essen":         [2, 3],
};

// [col, row] indices into yellowcard.png (3 cols × 4 rows)
const YELLOW_SPRITE: Record<string, [number, number]> = {
  "lagos":        [0, 0], "khartoum":     [1, 0], "kinshasa":     [2, 0],
  "johannesburg": [0, 1], "sao-paulo":    [1, 1], "bogota":       [2, 1],
  "lima":         [0, 2], "santiago":     [1, 2], "buenos-aires": [2, 2],
  "los-angeles":  [0, 3], "mexico-city":  [1, 3], "miami":        [2, 3],
};

const VIRUS_SRC: Record<string, string> = {
  black: blackVirusSrc, blue: blueVirusSrc, red: redVirusSrc, yellow: yellowVirusSrc,
};

const CITY_META: Record<string, { country: string; continent: string }> = {
  "san-francisco":   { country: "United States",  continent: "North America" },
  "chicago":         { country: "United States",  continent: "North America" },
  "montreal":        { country: "Canada",          continent: "North America" },
  "new-york":        { country: "United States",  continent: "North America" },
  "washington":      { country: "United States",  continent: "North America" },
  "atlanta":         { country: "United States",  continent: "North America" },
  "london":          { country: "United Kingdom", continent: "Europe" },
  "madrid":          { country: "Spain",           continent: "Europe" },
  "paris":           { country: "France",          continent: "Europe" },
  "essen":           { country: "Germany",         continent: "Europe" },
  "milan":           { country: "Italy",           continent: "Europe" },
  "st-petersburg":   { country: "Russia",          continent: "Europe" },
  "los-angeles":     { country: "United States",  continent: "North America" },
  "mexico-city":     { country: "Mexico",          continent: "North America" },
  "miami":           { country: "United States",  continent: "North America" },
  "bogota":          { country: "Colombia",        continent: "South America" },
  "lima":            { country: "Peru",            continent: "South America" },
  "santiago":        { country: "Chile",           continent: "South America" },
  "buenos-aires":    { country: "Argentina",       continent: "South America" },
  "sao-paulo":       { country: "Brazil",          continent: "South America" },
  "lagos":           { country: "Nigeria",         continent: "Africa" },
  "kinshasa":        { country: "DR Congo",        continent: "Africa" },
  "khartoum":        { country: "Sudan",           continent: "Africa" },
  "johannesburg":    { country: "South Africa",    continent: "Africa" },
  "algiers":         { country: "Algeria",         continent: "Africa" },
  "cairo":           { country: "Egypt",           continent: "Africa" },
  "istanbul":        { country: "Turkey",          continent: "Europe/Asia" },
  "moscow":          { country: "Russia",          continent: "Europe" },
  "baghdad":         { country: "Iraq",            continent: "Asia" },
  "riyadh":          { country: "Saudi Arabia",    continent: "Asia" },
  "tehran":          { country: "Iran",            continent: "Asia" },
  "karachi":         { country: "Pakistan",        continent: "Asia" },
  "delhi":           { country: "India",           continent: "Asia" },
  "mumbai":          { country: "India",           continent: "Asia" },
  "chennai":         { country: "India",           continent: "Asia" },
  "kolkata":         { country: "India",           continent: "Asia" },
  "beijing":         { country: "China",           continent: "Asia" },
  "seoul":           { country: "South Korea",     continent: "Asia" },
  "tokyo":           { country: "Japan",           continent: "Pacific Rim" },
  "osaka":           { country: "Japan",           continent: "Pacific Rim" },
  "shanghai":        { country: "China",           continent: "Asia" },
  "taipei":          { country: "Taiwan",          continent: "Pacific Rim" },
  "hong-kong":       { country: "China",           continent: "Asia" },
  "bangkok":         { country: "Thailand",        continent: "Asia" },
  "ho-chi-minh-city":{ country: "Vietnam",         continent: "Pacific Rim" },
  "manila":          { country: "Philippines",     continent: "Pacific Rim" },
  "jakarta":         { country: "Indonesia",       continent: "Pacific Rim" },
  "sydney":          { country: "Australia",       continent: "Pacific Rim" },
};

const DISEASE_COLOR: Record<string, string> = {
  blue:   "#000569",
  yellow: "#E3BB00",
  red:    "#FFB4A6",
  black:  "#8a9aaa",
};

const DISEASE_BG: Record<string, string> = {
  blue:   "#0a1e3a",
  yellow: "#1e1500",
  red:    "#2a0e08",
  black:  "#111418",
};


interface Props {
  city: City;
  /** Width in px; card keeps 2.5:3.5 aspect ratio */
  width?: number;
}

export function InfectionCard({ city, width = 160 }: Props) {
  const h = width * (2.5 / 3.5);
  const meta = CITY_META[city.id];
  const bar = DISEASE_COLOR[city.color] ?? "#333";
  const bg  = DISEASE_BG[city.color]   ?? "#111";
  const barH = width * 0.32;

  const blackPos = BLACK_SPRITE[city.id];
  if (blackPos) {
    const [col, row] = blackPos;
    return (
      <div style={{
        width, height: h,
        borderRadius: width * 0.06,
        overflow: "hidden",
        backgroundImage: `url(${blackCardSrc})`,
        backgroundSize: "300% 400%",
        backgroundPosition: `${col * 50}% ${row * (100 / 3)}%`,
        flexShrink: 0,
        userSelect: "none",
        border: `2px solid ${DISEASE_COLOR.black}`,
        boxShadow: `0 0 ${width * 0.12}px ${DISEASE_COLOR.black}66`,
      }} />
    );
  }

  const redPos = RED_SPRITE[city.id];
  if (redPos) {
    const [col, row] = redPos;
    return (
      <div style={{
        width, height: h,
        borderRadius: width * 0.06,
        overflow: "hidden",
        backgroundImage: `url(${redCardSrc})`,
        backgroundSize: "300% 400%",
        backgroundPosition: `${col * 50}% ${row * (100 / 3)}%`,
        flexShrink: 0,
        userSelect: "none",
        border: `2px solid ${DISEASE_COLOR.red}`,
        boxShadow: `0 0 ${width * 0.12}px ${DISEASE_COLOR.red}55`,
      }} />
    );
  }

  const bluePos = BLUE_SPRITE[city.id];
  if (bluePos) {
    const [col, row] = bluePos;
    return (
      <div style={{
        width, height: h,
        borderRadius: width * 0.06,
        overflow: "hidden",
        backgroundImage: `url(${blueCardSrc})`,
        backgroundSize: "300% 400%",
        backgroundPosition: `${col * 50}% ${row * (100 / 3)}%`,
        flexShrink: 0,
        userSelect: "none",
        border: `2px solid ${DISEASE_COLOR.blue}`,
        boxShadow: `0 0 ${width * 0.12}px ${DISEASE_COLOR.blue}55`,
      }} />
    );
  }

  const yellowPos = YELLOW_SPRITE[city.id];
  if (yellowPos) {
    const [col, row] = yellowPos;
    return (
      <div style={{
        width, height: h,
        borderRadius: width * 0.06,
        overflow: "hidden",
        backgroundImage: `url(${yellowCardSrc})`,
        backgroundSize: "300% 400%",
        backgroundPosition: `${col * 50}% ${row * (100 / 3)}%`,
        flexShrink: 0,
        userSelect: "none",
        border: `2px solid ${DISEASE_COLOR.yellow}`,
        boxShadow: `0 0 ${width * 0.12}px ${DISEASE_COLOR.yellow}55`,
      }} />
    );
  }

  return (
    <div style={{
      width, height: h,
      borderRadius: width * 0.06,
      overflow: "hidden",
      border: `2px solid ${bar}`,
      background: bg,
      boxShadow: `0 0 ${width * 0.12}px ${bar}55`,
      position: "relative",
      userSelect: "none",
      flexShrink: 0,
    }}>
      {/* Map-like dot-grid background */}
      <svg
        width="100%" height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`dots-${city.id}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={bar} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${city.id})`} />
      </svg>

      {/* Coloured title bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: barH,
        background: `linear-gradient(135deg, ${bar} 0%, ${bar}cc 100%)`,
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: `0 ${width * 0.08}px`,
        boxShadow: `0 2px 8px #0008`,
      }}>
        <div style={{
          fontSize: Math.min(width * 0.13, (width * 0.78) / (city.name.length * 0.68)),
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          lineHeight: 1.1,
          textShadow: "0 1px 3px #0006",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {city.name}
        </div>
        {meta && (
          <div style={{ marginTop: width * 0.015 }}>
            <div style={{
              fontSize: width * 0.05,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {meta.country}
            </div>
            <div style={{
              fontSize: width * 0.038,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {meta.continent}
            </div>
          </div>
        )}
      </div>

      {/* Disease symbol */}
      <div style={{
        position: "absolute",
        bottom: width * 0.08,
        right: width * 0.08,
        width: width * 0.28,
        height: width * 0.28,
        borderRadius: "50%",
        border: `2px solid ${bar}`,
        background: `${bar}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <img
          src={VIRUS_SRC[city.color]}
          alt=""
          draggable={false}
          style={{ width: "85%", height: "85%", objectFit: "contain", pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
