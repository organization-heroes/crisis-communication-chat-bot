/**
 *
 * main() will be run when you invoke this action
 *
 * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
 *
 * @return The output of this action, which must be a JSON object.
 *
 */
var request = require("request-promise");
const DiscoveryV1 = require("watson-developer-cloud/discovery/v1");

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function main(params) {
  if (params.type === "api") {
    /*
     * Use of the 'Johns Hopkins CSSE' resource
     */
    try {
      const summary = await request({
        method: "GET",
        uri: "https://api.covid19api.com/summary",
        json: true,
      });

      if (params.country) {
        for (var i = 0; i < summary.Countries.length; i++) {
          if (
            summary.Countries[i].Country.toLowerCase() ===
            params.country.toLowerCase()
          ) {
            return {
              result: `Data:Stats,Total Cases: ${summary.Countries[i].TotalConfirmed},\nTotal Deaths: ${summary.Countries[i].TotalDeaths},\nTotal Recovered: ${summary.Countries[i].TotalRecovered},\n\nSource: Johns Hopkins CSSE`,
            };
          }
        }
        return { error: "did not find country" };
      }
      let totalCases = 0;
      let totalDeaths = 0;
      let totalRecovered = 0;

      for (var i = 0; i < summary.Countries.length; i++) {
        totalCases += summary.Countries[i].TotalConfirmed;
        totalDeaths += summary.Countries[i].TotalDeaths;
        totalRecovered += summary.Countries[i].TotalRecovered;
      }
      return {
        result: `Data:Stats,Total Cases: ${totalCases},\nTotal Deaths: ${totalDeaths},\nTotal Recovered: ${totalRecovered},\n\nSource: Johns Hopkins CSSE`,
      };
    } catch (err) {
      return { error: "it failed : " + err };
    }
  } else {
    /*
     * Use of the 'Watson Discovery' as resource
     */
    const discovery = new DiscoveryV1({
      version: "2018-12-03",
      iam_apikey: params.api_key,
      url: params.url,
    });

    offset = getRandomInt(50);

    let queryParams = null;
    if (params.type === "numeric") {
      const numericsQueryParams = {
        environment_id: params.env_id_numeric,
        collection_id: params.collection_id_numeric,
        highlight: true,
        natural_language_query: params.inputText || "covid 19 status",
        count: 1,
      };

      queryParams = numericsQueryParams;
    } else if (params.type === "data") {
      const normalQueryParams = {
        environment_id: params.env_id,
        collection_id: params.collection_id,
        highlight: true,
        natural_language_query: params.inputText || "covid 19 summary",
        count: 1,
      };
      queryParams = normalQueryParams;
    } else {
      const commonQueryParams = {
        environment_id: params.common_env_id,
        collection_id: params.common_collection_id,
        highlight: true,
        natural_language_query: params.inputText || "covid 19 summary",
        count: 1,
      };
      queryParams = commonQueryParams;
    }
    try {
      data = await discovery.query(queryParams);

      if (data.results == undefined) {
        return { "discovery response error": data };
      }

      let response = data.results.map((v, i) => {
        return ` ${v.text}`;
      });
      return {
        result:
          "Here is the news article I found online.\n\n" +
          response.join("\n\n"),
      };
    } catch (err) {
      return { error: "it failed : " + err };
    }
  }
}
