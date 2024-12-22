import { InferOutput, maxValue, minValue, number, object, pipe } from "valibot";

export const WeatherForecastArguments = object({
  latitude: pipe(number(), minValue(-90), maxValue(90)),
  longitude: pipe(number(), minValue(-180), maxValue(180)),
});
export type WeatherForecastArguments = InferOutput<typeof WeatherForecastArguments>;
