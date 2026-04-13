const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  const workbook = xlsx.readFile('Collection Tab.numbers');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  const destDir = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(destDir, 'collection_data.json'), JSON.stringify(data, null, 2));
  console.log('Successfully wrote src/data/collection_data.json');
} catch (e) {
  console.error(e.message);
}
