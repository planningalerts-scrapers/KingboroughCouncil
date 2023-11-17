"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_1 = __importDefault(require("request-promise"));
const cheerio = __importStar(require("cheerio"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const luxon_1 = require("luxon");
const db_1 = require("./db");
sqlite3_1.default.verbose();
const info_url = "https://www.kingborough.tas.gov.au/development/planning-notices/";
const comment_url = "mailto:kc@kingborough.tas.gov.au";
(async () => {
    const $ = await (0, request_promise_1.default)({
        uri: "https://www.kingborough.tas.gov.au/development/planning-notices/",
        transform: (body) => cheerio.load(body),
    });
    /** Table rows parsed in to the database fields */
    const data = $("#list tbody tr")
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
            .filter((s) => !!s);
        /** Assign the string fields to variables */
        const [council_reference, address, on_notice_from, on_notice_to, description,] = strings;
        return {
            council_reference,
            address: `${address}, Tasmania`,
            description,
            info_url,
            comment_url,
            date_scraped: luxon_1.DateTime.now().toISODate(),
            on_notice_from: 
            /** Convert the date strings from localised version to ISO */
            luxon_1.DateTime.fromFormat(on_notice_from, "d MMM yyyy").toISODate() || "",
            on_notice_to: luxon_1.DateTime.fromFormat(on_notice_to, "d MMM yyyy").toISODate() || "",
            /** Dump the additional PDF links in to this extra variable
             * and figure out what to do with them later 🤷‍♂️.
             * morph.io API could be used to access this and download files */
            documents: JSON.stringify(documents),
        };
    });
    console.log(data);
    (0, db_1.insertData)(data);
})();
