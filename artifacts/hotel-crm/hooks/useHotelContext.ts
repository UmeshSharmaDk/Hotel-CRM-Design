import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

export interface Hotel {
  id: number;
  name: string;
  totalRooms: number;
  planStartDate: string;
  planEndDate: string;
}

export function useHotelContext() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHotels();
  }, [user]);

  const loadHotels = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === "admin") {
        const data = await api.get<Hotel[]>("/hotels");
        setHotels(data);
        const stored = await AsyncStorage.getItem("selected_hotel_id");
        if (stored && data.find((h) => h.id === parseInt(stored))) {
          setSelectedHotelId(parseInt(stored));
        } else if (data.length > 0) {
          setSelectedHotelId(data[0].id);
        }
      } else if (user.hotelId) {
        const data = await api.get<Hotel[]>("/hotels");
        const myHotel = data.filter((h) => h.id === user.hotelId);
        setHotels(myHotel.length > 0 ? myHotel : []);
        setSelectedHotelId(user.hotelId);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const selectHotel = async (id: number) => {
    setSelectedHotelId(id);
    await AsyncStorage.setItem("selected_hotel_id", id.toString());
  };

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) || null;

  return { hotels, selectedHotel, selectedHotelId, selectHotel, loading, reload: loadHotels };
}
