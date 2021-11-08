/**
 * generate i18n files from google sheet
 * Use this script using `yarn run generate-i18n`
 */

import axios from 'axios';
import papa from 'papaparse';
import fs from 'fs';

const SHEET_CSV_URL =
  'http://docs.google.com/spreadsheets/d/e/2PACX-1vTUsMndccslvcJzIbZ5kvXzx6ltJzNe3O0vpBYDv56d7mhFzW-laRfZRRwJ9DT3hboTafba2lHFyrzQ/pub?gid=0&single=true&output=csv';

async function fetchSheet(csvURL) {
  const response = await axios.get(csvURL);

  const responseString = response.data.toString();
  const parsedResult = papa.parse(responseString);

  return parsedResult.data;
}

/**
 *
 * @param sheetData
 * @returns Array<{local: string, keys: Array<{Object}>}>
 */
async function parseSheetData(sheetData) {
  // get the first row of the sheet, remove first column, get locals
  const locales = sheetData
    .shift()
    .slice(1)
    .map(locale => {
      return { locale, keys: {} };
    });

  // sort the sheet data by key
  const sortedRows = sheetData.sort((a, b) => {
    return a[0] - b[0];
  });

  // construct the keys for each locale
  sortedRows.forEach(row => {
    const key = row.shift();
    row.forEach((value, index) => {
      if (value && value.length > 0) {
        locales[index].keys[key] = value;
      }
    });
  });

  return locales;
}

async function saveToDisk(localDatas) {
  localDatas.forEach(locale => {
    const filePath = `./src/language/${locale.locale}.json`;
    const fileContent = JSON.stringify(locale.keys, null, 2);
    fileContent.trim()
    fs.writeFileSync(filePath, fileContent);
  });
}

async function main() {
  console.log('Fetching sheet...');
  const sheetData = await fetchSheet(SHEET_CSV_URL);
  console.log('Parsing sheet...');
  const parsedData = await parseSheetData(sheetData);
  await saveToDisk(parsedData);
  console.log('🍻 All set')
}

main();