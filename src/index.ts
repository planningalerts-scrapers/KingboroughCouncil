import request from 'request-promise';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import sqlite3 from 'sqlite3';
import { DateTime } from 'luxon';

type FieldNames =
  | 'council_reference'
  | 'address'
  | 'description'
  | 'info_url'
  | 'date_scraped'
  | 'on_notice_from'
  | 'on_notice_to';
// | 'more_info';

type Document = Record<FieldNames, string>;

/** The field names in the SQL database.
 * Use this for consistent ordering of fields in queries.
 */
const fieldNames: readonly FieldNames[] = [
  'council_reference',
  'address',
  'description',
  'info_url',
  'date_scraped',
  'on_notice_from',
  'on_notice_to',
  // 'more_info',
];

const options = {
  uri: 'https://www.kingborough.tas.gov.au/development/planning-notices/',
  transform: (body: string) => cheerio.load(body),
};

sqlite3.verbose();

(async () => {
  const $: CheerioAPI = await request(options);

  /** Table rows parsed in to the database fields */
  const data: Document[] = $('#list tbody tr')
    .toArray()
    .map((el) => {
      const cells = $(el).find('td');

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
      const more_info = $(el)
        .find('a')
        .toArray()
        .map((el) => $(el).attr('href'))
        .filter((s): s is string => !!s);

      /** First link is the primary Development Application document */
      const info_url = more_info.shift() || '';

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
        address,
        description,
        info_url,
        date_scraped: new Date().toISOString(),
        on_notice_from:
          /** Convert the date strings from localised version to ISO */
          DateTime.fromFormat(on_notice_from, 'd MMM yyyy').toISODate() || '',
        on_notice_to:
          DateTime.fromFormat(on_notice_to, 'd MMM yyyy').toISODate() || '',
        /** Dump the additional PDF links in to this extra variable
         * and figure out what to do with them later 🤷‍♂️.
         * morph.io API could be used to access this and download files */
        more_info: JSON.stringify(more_info),
      };
    });

  console.log(data);
  // Open a database handle
  var db = new sqlite3.Database('data.sqlite');
  const createFields = fieldNames
    .map((f, i) => {
      if (i === 0) return `${f} TEXT PRIMARY KEY`;
      return `${f} TEXT`;
    })
    .join(', ');
  const createQuery = `CREATE TABLE IF NOT EXISTS data (${createFields})`;
  const insertFields = fieldNames.join(', ');

  /** Morph.io appears to persist the database across scraper runs.
   * This should be enough to insert new DAs, update DAs when they change,
   * and keep their data when they are removed from the website.
   */
  const insertQuery = `INSERT OR REPLACE INTO data (${insertFields}) VALUES (${fieldNames
    .map(() => '?')
    .join(', ')})`;
  db.serialize(function () {
    //Create new table
    console.log(`createQuery:`, createQuery);
    db.run(createQuery);

    // TODO: Figure out how to add a column if it doesn't exist
    // db.get('SELECT more_info from data', (error) => {
    //   console.log('error', error);
    //   if (error) {
    //     db.run('ALTER TABLE data ADD COLUMN more_info TEXT');
    //   }
    // });

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
        record[fieldNames[6]]
        // record[fieldNames[7]]
      );
    });
    statement.finalize();
    console.log('Inserted/updated', data.length, 'records');
  });
})();
