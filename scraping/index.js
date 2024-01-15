import fs from "fs/promises";
import * as cheerio from "cheerio";

import dotenv from "dotenv";
dotenv.config();

const DINE_OUT_BASE_URL = "https://www.dineoutvancouver.com";
const TOKEN = process.env.TOKEN;

/**
 *
 * @param {string} url
 */
async function getDetail(url) {
  const res = await fetch(`${DINE_OUT_BASE_URL}${url}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`, {
      cause: await res.text(),
    });
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("text/html")) {
    throw new Error(`Invalid content type ${contentType}`);
  }

  if (res.status !== 200) {
    throw new Error(`Invalid status code ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  return $;
}

/**
 *
 * @param {number} limit
 * @param {number} skip
 * @returns
 */
function getDineoutApiParams(limit, skip) {
  return {
    filter: {
      filter_tags: { $in: ["site_dineout_subcatid_4204"] },
      $and: [
        {
          $or: [
            {
              "amenities.dineoutbreakfastbrunchmenu_enablemenu.value_raw": true,
            },
            { "amenities.dineout_enablemenu.value_raw": true },
            { "amenities.dineoutlunchmenu_enablemenu.value_raw": true },
            { "amenities.dineoutbreakfastmenu_enablemenu.value_raw": true },
            { "amenities.dineouttogo_enablemenu.value_raw": true },
            { "amenities.dineoutspecialoffer_enablemenu.value_raw": true },
          ],
        },
      ],
    },
    options: {
      limit,
      skip,
      fields: {
        "crmtracking.core_listing_click": 1,
        "crmtracking.core_twitter_click": 1,
        "crmtracking.core_facebook_click": 1,
        categories: 1,
        detailURL: 1,
        dtn: 1,
        isDTN: 1,
        loc: 1,
        latitude: 1,
        longitude: 1,
        description: 1,
        "primary_category.catname": 1,
        "primary_category.subcatname": 1,
        primary_site: 1,
        primary_image_url: 1,
        rankid: 1,
        rankorder: 1,
        rankname: 1,
        recid: 1,
        title: 1,
        detail_type: 1,
        qualityScore: 1,
        "amenities.dineout_dinnermenuprice.listid": 1,
        "amenities.dineout_dinnermenuprice.listvalue": 1,
        "amenities.dineout_cuisinetype.listid": 1,
        "amenities.dineout_cuisinetype.listvalue": 1,
        "amenities.dineout_neighborhood.listid": 1,
        "amenities.dineout_neighborhood.listvalue": 1,
        "amenities.dineoutlunchmenu_lunchmenuprice.value_raw": 1,
        "amenities.dineout_glutenfreeoptions.value_raw": 1,
        "amenities.dineout_veggieoptions.value_raw": 1,
        "amenities.dineout_reservationstatus.value": 1,
        "amenities.dineouttogo_reservation.value": 1,
        "amenities.dineoutlunchmenu_reservationstatus": 1,
        "amenities.dineoutbreakfastbrunchmenu_reservationstatus": 1,
        "amenities.dineoutbreakfastbrunchmenu_enablemenu": 1,
        "amenities.dineout_enablemenu": 1,
        "amenities.dineoutlunchmenu_enablemenu": 1,
        "amenities.dineoutbreakfastmenu_enablemenu": 1,
        "amenities.dineouttogo_enablemenu": 1,
        "amenities.dineoutspecialoffer_enablemenu": 1,
        "amenities.michelinaward": 1,
      },
      count: true,
      castDocs: false,
      hooks: ["afterFind_offers"],
      sort: { qualityScore: -1, sortcompany: 1 },
    },
  };
}

/**
 *
 * @returns {Promise<import('./index.js').Restaurant[]>}
 */
async function getRestaurants() {
  try {
    const restaurants = JSON.parse(
      await fs.readFile(new URL("./restaurants.json", import.meta.url), "utf8"),
    );
    return restaurants;
  } catch (e) {
    if (/** @type {any} */ (e).code !== "ENOENT") {
      throw e;
    }
  }

  const TOTAL_COUNT = 400;
  const TOTAL_RESULT_SIZE = 1_000_000;
  const SIZE_LIMIT_PER_REQUEST = 200_000;

  const REQUESTS_TO_PERFORM =
    Math.ceil(TOTAL_RESULT_SIZE / SIZE_LIMIT_PER_REQUEST) + 2;
  const LIMIT_PER_REQUEST = Math.ceil(TOTAL_COUNT / REQUESTS_TO_PERFORM);

  const restaurants = [];

  for (let i = 0; i < REQUESTS_TO_PERFORM; i++) {
    const res = await fetch(
      `${DINE_OUT_BASE_URL}/includes/rest_v2/plugins_listings_listings/find/?json=${JSON.stringify(
        getDineoutApiParams(LIMIT_PER_REQUEST, i * LIMIT_PER_REQUEST),
      )}&token=${TOKEN}`,
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch`, {
        cause: await res.text(),
      });
    }

    if (res.status !== 200) {
      throw new Error(`Invalid status code ${res.status}`, {
        cause: await res.text(),
      });
    }

    const json = /** @type {import('./index.js').DineOutApiResult} */ (
      await res.json()
    );

    if (json.docs.docs.length === 0) {
      break;
    }

    restaurants.push(...json.docs.docs);
  }

  await fs.writeFile(
    new URL("./restaurants.json", import.meta.url),
    JSON.stringify(restaurants, null, 2),
  );

  return restaurants;
}

/**
 *
 * @param {import("./index.js").Restaurant[]} restaurants
 * @returns {Promise<import('./index.js').Restaurant[]>}
 */
async function getVeganRestaurants(restaurants) {
  try {
    const veganRestaurants = JSON.parse(
      await fs.readFile(new URL("./vegan.json", import.meta.url), "utf8"),
    );
    return veganRestaurants;
  } catch (e) {
    if (/** @type {any} */ (e).code !== "ENOENT") {
      throw e;
    }
  }

  /** @type {import('./index.js').Restaurant[]} */
  const veganRestaurants = [];
  for (const restaurant of restaurants) {
    console.log(`Checking ${restaurant.title}`);
    const $ = await getDetail(restaurant.detailURL);
    const isVegan = /vegan/i.test($.text());
    if (isVegan) {
      veganRestaurants.push(restaurant);
    }
  }

  await fs.writeFile(
    new URL("./vegan.json", import.meta.url),
    JSON.stringify(veganRestaurants, null, 2),
  );

  return veganRestaurants;
}

async function main() {
  const restaurants = await getRestaurants();
  const veganRestaurants = await getVeganRestaurants(restaurants);
}

await main().catch(console.error);
