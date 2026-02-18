import type { Amenity } from "@trip-loom/api/enums";
import {
  StarIcon,
  WifiIcon,
  CarIcon,
  UtensilsIcon,
  WavesIcon,
  DumbbellIcon,
  PawPrintIcon,
  GlassWaterIcon,
  BriefcaseIcon,
  ShirtIcon,
  AirVentIcon,
  MountainSnowIcon,
  BuildingIcon,
  ConciergeBellIcon,
  PlaneIcon,
  ClockIcon,
  ShieldCheckIcon,
  AccessibilityIcon,
  BadgeCheckIcon,
  BabyIcon,
  LuggageIcon,
  CroissantIcon,
  Dice5Icon,
  DollarSignIcon,
  BellIcon,
  BatteryChargingIcon,
  CrownIcon,
  TicketCheckIcon,
  UsersIcon,
  FlameIcon,
  ShoppingBagIcon,
  WindIcon,
  CookingPotIcon,
  MartiniIcon,
  CigaretteOffIcon,
  FilmIcon,
  ArmchairIcon,
  UmbrellaIcon,
  BathIcon,
  LockIcon,
  BusIcon,
  EarOffIcon,
  BedDoubleIcon,
  SunIcon,
  TvIcon,
  MonitorIcon,
  BikeIcon,
  FishIcon,
  SailboatIcon,
  BackpackIcon,
  LeafIcon,
  PhoneIcon,
  HandHeartIcon,
  HeartIcon,
  BrushCleaningIcon,
  type LucideIcon,
  FlameKindlingIcon,
} from "lucide-react";

export const amenityIcons: Partial<Record<Amenity, LucideIcon>> = {
  wifi: WifiIcon,
  "free-wifi": WifiIcon,

  pool: WavesIcon,
  "indoor-pool": WavesIcon,
  "outdoor-pool": WavesIcon,
  "heated-pool": WavesIcon,
  "infinity-pool": WavesIcon,
  "rooftop-pool": WavesIcon,

  spa: GlassWaterIcon,
  sauna: FlameIcon,
  "steam-room": WindIcon,
  "hot-tub": BathIcon,

  gym: DumbbellIcon,
  "fitness-center": DumbbellIcon,

  restaurant: UtensilsIcon,
  bar: MartiniIcon,
  "rooftop-bar": MartiniIcon,
  "coffee-shop": GlassWaterIcon,

  parking: CarIcon,
  "free-parking": CarIcon,
  "valet-parking": CarIcon,

  "airport-shuttle": PlaneIcon,
  "free-airport-transportation": PlaneIcon,

  "room-service": ConciergeBellIcon,
  concierge: ConciergeBellIcon,

  "beach-access": WavesIcon,
  beachfront: WavesIcon,
  "private-beach": WavesIcon,

  "pet-friendly": PawPrintIcon,

  "business-center": BriefcaseIcon,
  "meeting-rooms": BriefcaseIcon,
  "conference-facilities": BriefcaseIcon,

  "kids-club": StarIcon,
  "kids-pool": BabyIcon,

  laundry: ShirtIcon,
  "dry-cleaning": ShirtIcon,

  "air-conditioning": AirVentIcon,

  balcony: MountainSnowIcon,
  "private-balcony": MountainSnowIcon,

  "ocean-view": WavesIcon,
  "city-view": BuildingIcon,
  "mountain-view": MountainSnowIcon,

  "24-hour-front-desk": ClockIcon,
  "24-hour-security": ShieldCheckIcon,

  "accessible-rooms": AccessibilityIcon,
  "wheelchair-access": AccessibilityIcon,

  "all-inclusive": BadgeCheckIcon,

  babysitting: BabyIcon,
  "baggage-storage": LuggageIcon,

  bathrobes: ShirtIcon,

  "breakfast-included": CroissantIcon,
  "breakfast-buffet": CroissantIcon,

  casino: Dice5Icon,
  "currency-exchange": DollarSignIcon,

  doorperson: BellIcon,

  "electric-vehicle-charging": BatteryChargingIcon,

  "executive-lounge": CrownIcon,
  "express-check-in": TicketCheckIcon,

  "family-rooms": UsersIcon,

  fireplace: FlameKindlingIcon,

  "gift-shop": ShoppingBagIcon,

  "golf-course": StarIcon,

  "hair-dryer": WindIcon,

  housekeeping: BrushCleaningIcon,

  kitchenette: CookingPotIcon,

  minibar: MartiniIcon,

  "non-smoking-rooms": CigaretteOffIcon,
  "non-smoking-hotel": CigaretteOffIcon,

  "on-demand-movies": FilmIcon,

  "outdoor-furniture": ArmchairIcon,

  patio: UmbrellaIcon,

  "private-bathroom": BathIcon,

  refrigerator: GlassWaterIcon,

  safe: LockIcon,

  "shuttle-service": BusIcon,

  "soundproof-rooms": EarOffIcon,

  suites: BedDoubleIcon,

  "sun-terrace": SunIcon,

  "tennis-court": DumbbellIcon,

  tv: TvIcon,
  "flatscreen-tv": MonitorIcon,

  "bicycle-rental": BikeIcon,

  diving: FishIcon,
  snorkeling: FishIcon,
  "water-sports": SailboatIcon,

  hiking: BackpackIcon,

  "yoga-classes": HeartIcon,

  "poolside-bar": MartiniIcon,
  "snack-bar": UtensilsIcon,
  "special-diet-menus": LeafIcon,

  telephone: PhoneIcon,
  iron: ShirtIcon,

  massage: HandHeartIcon,
  "couples-massage": HeartIcon,
};
