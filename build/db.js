"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertData = exports.fieldNames = void 0;
// Initialise our database
const sqlite3_1 = __importDefault(require("sqlite3"));
/** The field names in the SQL database.
 * Use this for consistent ordering of fields in queries.
 */
exports.fieldNames = [
    "council_reference",
    "address",
    "description",
    "info_url",
    "comment_url",
    "date_scraped",
    "on_notice_from",
    "on_notice_to",
    "documents",
];
const db = new sqlite3_1.default.Database("data.sqlite");
db.serialize(function () {
    const createFields = exports.fieldNames
        .map((f, i) => {
        if (i === 0)
            return `${f} TEXT PRIMARY KEY`;
        return `${f} TEXT`;
    })
        .join(", ");
    const createQuery = `CREATE TABLE IF NOT EXISTS data (${createFields})`;
    //Create new table
    console.log(`createQuery:`, createQuery);
    db.run(createQuery);
});
// add the documents column if it doesn't exist
db.serialize(function () {
    // Check if the column already exists
    const checkQuery = `PRAGMA table_info(data)`;
    db.all(checkQuery, function (err, rows) {
        console.log("🚀 ~ file: index.ts:62 ~ row:", rows);
        if (err) {
            console.error(err.message);
            return;
        }
        const rowExists = !!rows.find((r) => r.name === "documents");
        if (!rowExists) {
            // Column doesn't exist, execute the ALTER TABLE statement
            db.run(`ALTER TABLE data ADD COLUMN documents TEXT`, function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log('Column "documents" added to the table "data"');
            });
        }
    });
});
function insertData(data) {
    db.serialize(function () {
        const insertFields = exports.fieldNames.join(", ");
        /** Morph.io appears to persist the database across scraper runs.
         * This should be enough to insert new DAs, update DAs when they change,
         * and keep their data when they are removed from the website.
         */
        const insertQuery = `INSERT OR REPLACE INTO data (${insertFields}) VALUES (${exports.fieldNames
            .map(() => "?")
            .join(", ")})`;
        console.log(`insertQuery:`, insertQuery);
        /** Insert new records */
        var statement = db.prepare(insertQuery);
        data.forEach((record) => {
            statement.run(record[exports.fieldNames[0]], record[exports.fieldNames[1]], record[exports.fieldNames[2]], record[exports.fieldNames[3]], record[exports.fieldNames[4]], record[exports.fieldNames[5]], record[exports.fieldNames[6]], record[exports.fieldNames[7]], record[exports.fieldNames[8]]);
        });
        statement.finalize();
        console.log("Inserted/updated", data.length, "records");
    });
}
exports.insertData = insertData;
exports.default = db;
