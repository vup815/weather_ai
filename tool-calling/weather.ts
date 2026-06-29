export interface WeatherData {
  temp: number;
  condition: string;
}

export async function getCurrentWeather(location: string): Promise<WeatherData> {
  const conditions = ["晴天", "多雲", "陰天", "小雨", "大雨", "颱風"];
  return {
    temp: Math.floor(Math.random() * 30) + 10,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
  };
}
