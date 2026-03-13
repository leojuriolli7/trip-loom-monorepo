export const mapStyles: google.maps.MapTypeStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "var(--secondary)" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--muted-foreground)" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "var(--secondary)" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "var(--border)" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--foreground)" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--foreground)" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--muted-foreground)" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "var(--muted)" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--secondary-foreground)" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "var(--secondary)" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "var(--card)" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--muted-foreground)" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "var(--muted)" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "var(--card)" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "var(--card)" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--muted-foreground)" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--secondary-foreground)" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "var(--background)" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "var(--secondary-foreground)" }],
  },
];
