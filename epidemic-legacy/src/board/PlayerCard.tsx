import type { City } from "./cities";

import imgAtlanta      from "../../object/player card/Atlanta.png";
import imgBangkok      from "../../object/player card/BANGKOK.png";
import imgBeijing      from "../../object/player card/BEIJING.png";
import imgBuenosAires  from "../../object/player card/BUENOS AIRES.png";
import imgChennai      from "../../object/player card/CHENNAI.png";
import imgChicago      from "../../object/player card/Chicago.png";
import imgDelhi        from "../../object/player card/DELHI.png";
import imgHochiminh    from "../../object/player card/hochiminh.png";
import imgHongKong     from "../../object/player card/Hong kong.png";
import imgIstanbul     from "../../object/player card/ISTANBUL.png";
import imgJakarta      from "../../object/player card/JAKARTA.png";
import imgJohannesburg from "../../object/player card/Johannesburg.png";
import imgKhartoum     from "../../object/player card/Khartoum.png";
import imgLagos        from "../../object/player card/Lagos.png";
import imgLondon       from "../../object/player card/LONDON.png";
import imgManila       from "../../object/player card/Manila.png";
import imgMontreal     from "../../object/player card/Montreal.png";
import imgMumbai       from "../../object/player card/MUMBAI.png";
import imgNewYork      from "../../object/player card/New york.png";
import imgOsaka        from "../../object/player card/OSAKA.png";
import imgRiyadh       from "../../object/player card/Riyahd.png";
import imgSanFrancisco from "../../object/player card/San francisco.png";
import imgSeoul        from "../../object/player card/SEOUL.png";
import imgShanghai     from "../../object/player card/Shanghai.png";
import imgSydney       from "../../object/player card/SYDNEY.png";
import imgTaipei       from "../../object/player card/TAIPEI.png";
import imgTehran       from "../../object/player card/TEHRAN.png";
import imgTokyo        from "../../object/player card/Tokyo.png";
import imgWashington   from "../../object/player card/Washington.png";
import imgBogota       from "../../object/player card/BOGOTA.png";
import imgLosAngeles   from "../../object/player card/LOS ANGELES.png";
import imgSaoPaulo     from "../../object/player card/SAO PAULO.png";
import imgLima         from "../../object/player card/LIMA.png";
import imgSantiago     from "../../object/player card/SANTIAGO.png";
import imgKinshasa     from "../../object/player card/KINSHASA.png";
import imgMexicoCity   from "../../object/player card/mexicocity.png";
import imgMiami        from "../../object/player card/Miami.png";
import imgAlgiers      from "../../object/player card/Algiers.png";
import imgBaghdad      from "../../object/player card/Baghdad.png";
import imgMadrid       from "../../object/player card/Madrid.png";
import imgCairo        from "../../object/player card/Cairo.png";
import imgKarachi      from "../../object/player card/Karachi.png";
import imgKolkata      from "../../object/player card/Kolkata.png";
import imgMoscow       from "../../object/player card/Moscow.png";
import imgParis        from "../../object/player card/paris.png";
import imgMilan        from "../../object/player card/Milan.png";
import imgEssen        from "../../object/player card/Essen.png";
import imgStPetersburg from "../../object/player card/Stpeterburg.png";

const CITY_IMAGE: Record<string, string> = {
  "atlanta":          imgAtlanta,
  "bangkok":          imgBangkok,
  "beijing":          imgBeijing,
  "buenos-aires":     imgBuenosAires,
  "chennai":          imgChennai,
  "chicago":          imgChicago,
  "delhi":            imgDelhi,
  "ho-chi-minh-city": imgHochiminh,
  "hong-kong":        imgHongKong,
  "istanbul":         imgIstanbul,
  "jakarta":          imgJakarta,
  "johannesburg":     imgJohannesburg,
  "khartoum":         imgKhartoum,
  "lagos":            imgLagos,
  "london":           imgLondon,
  "manila":           imgManila,
  "montreal":         imgMontreal,
  "mumbai":           imgMumbai,
  "new-york":         imgNewYork,
  "osaka":            imgOsaka,
  "riyadh":           imgRiyadh,
  "san-francisco":    imgSanFrancisco,
  "seoul":            imgSeoul,
  "shanghai":         imgShanghai,
  "sydney":           imgSydney,
  "taipei":           imgTaipei,
  "tehran":           imgTehran,
  "tokyo":            imgTokyo,
  "washington":       imgWashington,
  "bogota":           imgBogota,
  "los-angeles":      imgLosAngeles,
  "sao-paulo":        imgSaoPaulo,
  "lima":             imgLima,
  "santiago":         imgSantiago,
  "kinshasa":         imgKinshasa,
  "mexico-city":      imgMexicoCity,
  "paris":            imgParis,
  "milan":            imgMilan,
  "essen":            imgEssen,
  "st-petersburg":    imgStPetersburg,
  "miami":            imgMiami,
  "algiers":          imgAlgiers,
  "cairo":            imgCairo,
  "karachi":          imgKarachi,
  "kolkata":          imgKolkata,
  "moscow":           imgMoscow,
  "baghdad":          imgBaghdad,
  "madrid":           imgMadrid,
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
  blue:   "#1a6bbf",
  yellow: "#d4a800",
  red:    "#c0181c",
  black:  "#2a2a2a",
};

interface Props {
  city: City;
  /** Width in px; card keeps 2.5:3.5 aspect ratio (portrait) */
  width?: number;
}

export function PlayerCard({ city, width = 120 }: Props) {
  const h = width * (3.5 / 2.5);
  const meta = CITY_META[city.id];
  const bar = DISEASE_COLOR[city.color] ?? "#333";
  const bg = "#1e3575";
  const barH = h * 0.22;

  const imgSrc = CITY_IMAGE[city.id];
  if (imgSrc) {
    return (
      <div style={{
        width, height: h,
        borderRadius: width * 0.06,
        overflow: "hidden",
        backgroundImage: `url(${imgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: `2px solid ${bar}`,
        boxShadow: `0 0 ${width * 0.12}px ${bar}55`,
        flexShrink: 0,
        userSelect: "none",
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
          <pattern id={`pdots-${city.id}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={bar} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pdots-${city.id})`} />
      </svg>

      {/* Coloured title bar at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: barH,
        background: `linear-gradient(135deg, ${bar} 0%, ${bar}cc 100%)`,
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: `0 ${width * 0.08}px`,
        boxShadow: "0 2px 8px #0008",
      }}>
        <div style={{
          fontSize: Math.min(width * 0.13, (width * 0.82) / (city.name.length * 0.72)),
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          lineHeight: 1.1,
          textShadow: "0 1px 3px #0006",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}>
          {city.name}
        </div>
        {meta && (
          <div style={{ marginTop: width * 0.015 }}>
            <div style={{
              fontSize: width * 0.055,
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
              fontSize: width * 0.04,
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

    </div>
  );
}
