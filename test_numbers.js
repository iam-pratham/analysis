const xlsx = require('xlsx');
try {
  const workbook = xlsx.readFile('Collection Tab.numbers');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (e) {
  console.error(e.message);
}
