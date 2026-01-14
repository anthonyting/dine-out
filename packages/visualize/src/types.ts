import type restaurantsChunk1 from "../../scraping/dist/menu/chunks/restaurants.1.min.json";

export type Restaurant = (typeof restaurantsChunk1)[number];
export type TableData = { restaurant: Restaurant };
