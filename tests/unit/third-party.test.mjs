// The SDK's own pages leave out every third-party load, web fonts, PayPal's Braintree scripts and
// the analytics pixel, when the build sets DISABLE_THIRD_PARTY_LOADS: `npm run test:unit`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import template from "lodash/template.js";

const require = createRequire(import.meta.url);
const THIRD_PARTY = /fonts\.googleapis\.com|braintreegateway\.com|scarf\.sh/;
const PAGES = ["public/build.html", "public/fullscreenIndexTemplate.html"];

/** The pages' templates as the build gives them to HtmlWebpackPlugin, by output name. */
const parameters = (disabled) => {
  process.env.DISABLE_THIRD_PARTY_LOADS = disabled;
  delete require.cache[require.resolve("../../webpack.common.js")];
  const config = require("../../webpack.common.js")();
  return config.plugins
    .filter((plugin) => plugin.constructor.name === "HtmlWebpackPlugin")
    .map((plugin) => plugin.userOptions.templateParameters ?? {});
};

// The fullscreen page's own font links are commented out: build.html alone loads third parties.
test("build.html has no third-party load when they are disabled", () => {
  const render = template(readFileSync("public/build.html", "utf8"));
  const loads = (thirdPartyLoads) => render({ thirdPartyLoads }).replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(loads(false), THIRD_PARTY);
  assert.match(loads(true), THIRD_PARTY);
});

test("the build keeps third-party loads unless DISABLE_THIRD_PARTY_LOADS is true", () => {
  for (const [disabled, loads] of [["", true], ["false", true], ["true", false]]) {
    const pages = parameters(disabled);
    assert.equal(pages.length, PAGES.length);
    for (const page of pages) {
      assert.equal(page.thirdPartyLoads, loads, `DISABLE_THIRD_PARTY_LOADS=${disabled}`);
    }
  }
});
