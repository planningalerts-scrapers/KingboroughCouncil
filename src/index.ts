import request from "request-promise";
import * as cheerio from "cheerio";
import sqlite3 from "sqlite3";
import { DateTime } from "luxon";
import { CheerioAPI } from "cheerio/lib/slim";
import { insertData } from "./db";
import type { Document } from "./db";

sqlite3.verbose();

const info_url =
  "https://www.kingborough.tas.gov.au/development/planning-notices/";
const comment_url = "mailto:kc@kingborough.tas.gov.au";

(async () => {
  const $: CheerioAPI = await request({
    uri: "https://www.kingborough.tas.gov.au/development/planning-notices/",
    transform: (body: string) => cheerio.load(body),
  });

  /** Table rows parsed in to the database fields */
  const data: Document[] = $("#list tbody tr")
    .toArray()
    .map((el) => {
      const cells = $(el).find("td");

      /** The first 5 fields are just simple strings */
      const strings = cells
        .toArray()
        .map((el) => $(el).text().trim())
        .slice(0, 5);

      /** The 6th field contains links to 1 or more PDFs, including:
       * - Development Application
       * - Bushfire Hazard Assessments
       * - Environmental Impact Assessments
       * - etc
       */
      const documents = $(el)
        .find("a")
        .toArray()
        .map((el) => $(el).attr("href"))
        .filter((s): s is string => !!s);

      /** Assign the string fields to variables */
      const [
        council_reference,
        address,
        on_notice_from,
        on_notice_to,
        description,
      ] = strings;

      return {
        council_reference,
        address: `${address}, Tasmania`,
        description,
        info_url,
        comment_url,
        date_scraped: DateTime.now().toISODate()!,
        on_notice_from:
          /** Convert the date strings from localised version to ISO */
          DateTime.fromFormat(on_notice_from, "d MMM yyyy").toISODate() || "",
        on_notice_to:
          DateTime.fromFormat(on_notice_to, "d MMM yyyy").toISODate() || "",
        /** Dump the additional PDF links in to this extra variable
         * and figure out what to do with them later 🤷‍♂️.
         * morph.io API could be used to access this and download files */
        documents: JSON.stringify(documents),
      };
    });

  console.log(data);

  insertData(data);
})();
