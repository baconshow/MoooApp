
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sun, Cloud, CloudRain, Cloudy, AlertCircle, MapPin } from 'lucide-react';

interface WeatherData {
    city: string;
    today: { temp: string; condition: string; icon: React.ElementType };
    tomorrow: { temp: string; condition: string; icon: React.ElementType };
    afterTomorrow: { temp: string; condition: string; icon: React.ElementType };
}

const getWeatherIcon = (code: number): React.ElementType => {
    if ([0, 1].includes(code)) return Sun;
    if ([2].includes(code)) return Cloudy;
    if ([3].includes(code)) return Cloud;
    if ([45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return CloudRain;
    return Sun;
};

const getWeatherCondition = (code: number): string => {
    const conditions: { [key: number]: string } = {
        0: "Céu limpo", 1: "Quase limpo", 2: "Parcialmente nublado", 3: "Nublado",
        45: "Nevoeiro", 48: "Nevoeiro com geada", 51: "Garoa leve", 53: "Garoa moderada",
        55: "Garoa forte", 56: "Garoa gelada leve", 57: "Garoa gelada forte",
        61: "Chuva leve", 63: "Chuva moderada", 65: "Chuva forte",
        66: "Chuva gelada leve", 67: "Chuva gelada forte", 80: "Pancadas de chuva leves",
        81: "Pancadas de chuva moderadas", 82: "Pancadas de chuva violentas",
        95: "Trovoada", 96: "Trovoada com granizo leve", 99: "Trovoada com granizo forte"
    };
    return conditions[code] || "Ensolarado";
};

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocalização não é suportada por este navegador.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`);
                    if (!weatherRes.ok) throw new Error("Falha ao buscar dados do tempo.");
                    const weatherData = await weatherRes.json();

                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!geoRes.ok) throw new Error("Falha ao buscar dados de localização.");
                    const geoData = await geoRes.json();
                    const city = geoData.address.city || geoData.address.town || geoData.address.village || "Localização desconhecida";
                    
                    setWeather({
                        city: city,
                        today: {
                            temp: `${Math.round(weatherData.current.temperature_2m)}°`,
                            condition: getWeatherCondition(weatherData.current.weather_code),
                            icon: getWeatherIcon(weatherData.current.weather_code),
                        },
                        tomorrow: {
                            temp: `${Math.round(weatherData.daily.temperature_2m_max[1])}°`,
                            condition: getWeatherCondition(weatherData.daily.weather_code[1]),
                            icon: getWeatherIcon(weatherData.daily.weather_code[1]),
                        },
                        afterTomorrow: {
                            temp: `${Math.round(weatherData.daily.temperature_2m_max[2])}°`,
                            condition: getWeatherCondition(weatherData.daily.weather_code[2]),
                            icon: getWeatherIcon(weatherData.daily.weather_code[2]),
                        },
                    });
                } catch (err) {
                    setError("Não foi possível carregar os dados do tempo.");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError("Acesso à localização negado. Ative para ver o clima.");
                setLoading(false);
            }
        );
    }, []);

    if (loading) {
        return (
            <Card className="claymorphism bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-4 w-48 mt-2" />
                        </div>
                        <div className="flex items-center gap-2">
                             <Skeleton className="h-8 w-8 rounded-full" />
                             <div>
                                <Skeleton className="h-8 w-12" />
                                <Skeleton className="h-3 w-16 mt-1" />
                             </div>
                        </div>
                    </div>
                     <div className="mt-4 flex justify-around text-center border-t border-border pt-2">
                        <div className="w-full"><Skeleton className="h-12 w-full" /></div>
                        <div className="w-full ml-4"><Skeleton className="h-12 w-full" /></div>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    if (error) {
        return (
             <Card className="claymorphism bg-destructive/20 border-destructive/50">
                <CardContent className="p-4 flex items-center justify-center text-center text-destructive-foreground">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <div>
                        <p className="font-semibold text-sm">Erro no Widget de Clima</p>
                        <p className="text-xs">{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!weather) return null;

    return (
        <Card className="claymorphism bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg flex items-center gap-1"><MapPin size={16} /> {weather.city}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <weather.today.icon className="h-8 w-8 text-yellow-400" />
                            <div>
                                <p className="text-2xl font-bold">{weather.today.temp}</p>
                                <p className="text-xs text-muted-foreground">{weather.today.condition}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-around text-center border-t border-border pt-2">
                     <div>
                        <p className="text-sm font-semibold">Amanhã</p>
                        <weather.tomorrow.icon className="h-6 w-6 mx-auto mt-1 text-muted-foreground" />
                        <p className="text-sm mt-1">{weather.tomorrow.temp}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Depois de amanhã</p>
                        <weather.afterTomorrow.icon className="h-6 w-6 mx-auto mt-1 text-primary" />
                        <p className="text-sm mt-1">{weather.afterTomorrow.temp}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
