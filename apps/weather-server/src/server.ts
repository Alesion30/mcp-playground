import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { parse, ValiError } from "valibot";
import { WeatherForecastArguments } from "./schemas/weather.js";
import { weatherGovApi } from "@mcp/external-api";
import { MCP_WEATHER_TOOLS } from "@mcp/constants/mcp-tools.js";

export const server = new Server(
  {
    name: "Weather MCP Server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: MCP_WEATHER_TOOLS.GET_FORECAST,
        description: "Get weather forecast for a location (US Only)",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location",
            },
            longitude: {
              type: "number",
              description: "Longitude of the location",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === MCP_WEATHER_TOOLS.GET_FORECAST) {
      const { latitude, longitude } = parse(WeatherForecastArguments, args);
      const weatherPointsResponse = await weatherGovApi.fetchWeatherPoints({
        latitude,
        longitude,
      });

      if (!weatherPointsResponse) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
            },
          ],
        };
      }

      const forecastUrl = weatherPointsResponse.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get forecast URL from grid point data",
            },
          ],
        };
      }

      const weatherForecastResponse = await weatherGovApi.fetchWeatherForecast(
        forecastUrl
      );
      if (!weatherForecastResponse) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve forecast data",
            },
          ],
        };
      }

      const periods = weatherForecastResponse.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No forecast periods available",
            },
          ],
        };
      }

      const formattedForecast = periods.map((period) =>
        [
          `${period.name || "Unknown"}:`,
          `Temperature: ${period.temperature || "Unknown"}°${
            period.temperatureUnit || "F"
          }`,
          `Wind: ${period.windSpeed || "Unknown"} ${
            period.windDirection || ""
          }`,
          `${period.shortForecast || "No forecast available"}`,
          "---",
        ].join("\n")
      );

      const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
        "\n"
      )}`;

      return {
        content: [
          {
            type: "text",
            text: forecastText,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof ValiError) {
      return {
        error: {
          code: "INVALID_ARGUMENTS",
          message: error.message,
        },
      };
    }
    throw error;
  }
});
