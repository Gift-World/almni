import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";

// Fix for default marker icons in React Leaflet with Vite
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

export default function ClientMap({ markers }: { markers: any[] }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup className="rounded-xl">
            <div className="flex min-w-[200px] flex-col gap-3 p-1">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={marker.avatar_url || ""} />
                  <AvatarFallback>{marker.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{marker.full_name}</div>
                  <div className="text-xs text-muted-foreground">{marker.location}</div>
                </div>
              </div>
              {marker.job_title && (
                <div className="text-sm">
                  {marker.job_title} {marker.company && `at ${marker.company}`}
                </div>
              )}
              <Link
                to="/alumni/$id"
                params={{ id: marker.id }}
                className="text-xs font-medium text-primary hover:underline"
              >
                View Profile
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
