// Initialise our database
import sqlite3 from "sqlite3";

export type FieldNames =
  | "council_reference"
  | "address"
  | "description"
  | "info_url"
  | "comment_url"
  | "date_scraped"
  | "on_notice_from"
  | "on_notice_to"
  | "documents";

/** The field names in the SQL database.
 * Use this for consistent ordering of fields in queries.
 */
export const fieldNames: readonly FieldNames[] = [
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

export type Document = Record<FieldNames, string>;

const db = new sqlite3.Database("data.sqlite");
db.serialize(function () {
  const createFields = fieldNames
    .map((f, i) => {
      if (i === 0) return `${f} TEXT PRIMARY KEY`;
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
  db.all(checkQuery, function (err, rows: { name: string }[]) {
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

export function insertData(data: Document[]) {
  db.serialize(function () {
    const insertFields = fieldNames.join(", ");
    /** Morph.io appears to persist the database across scraper runs.
     * This should be enough to insert new DAs, update DAs when they change,
     * and keep their data when they are removed from the website.
     */
    const insertQuery = `INSERT OR REPLACE INTO data (${insertFields}) VALUES (${fieldNames
      .map(() => "?")
      .join(", ")})`;

    console.log(`insertQuery:`, insertQuery);

    /** Insert new records */
    var statement = db.prepare(insertQuery);
    data.forEach((record) => {
      statement.run(
        record[fieldNames[0]],
        record[fieldNames[1]],
        record[fieldNames[2]],
        record[fieldNames[3]],
        record[fieldNames[4]],
        record[fieldNames[5]],
        record[fieldNames[6]],
        record[fieldNames[7]],
        record[fieldNames[8]]
      );
    });
    statement.finalize();
    console.log("Inserted/updated", data.length, "records");
  });
}

export default db;
