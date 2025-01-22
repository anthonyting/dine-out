const path = require("path");
const scrapingDistPath = path.resolve(
  __dirname,
  "../../packages/scraping/dist"
);

module.exports = {
  async onPreBuild({ utils }) {
    await utils.cache.restore(scrapingDistPath);

    const files = await utils.cache.list({ depth: 10 });
    console.log("Cached files", files);
  },
  async onPostBuild({ utils }) {
    await utils.cache.save(scrapingDistPath);

    const files = await utils.cache.list({ depth: 10 });
    console.log("Cached files", files);
  },
};
