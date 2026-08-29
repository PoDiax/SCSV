const fs = require('fs');
const path = require('path');

const issueBody = process.env.ISSUE_BODY;

if (!issueBody) {
  console.error("ISSUE_BODY environment variable is missing.");
  process.exit(1);
}

const langMatch = issueBody.match(/### Language\n+([^\n]+)/);
const currentTextMatch = issueBody.match(/### Current Text\n+([^#]+)/);
const newTextMatch = issueBody.match(/### Suggested Fix \(New Text\)\n+([^#]+)/);

if (!langMatch || !currentTextMatch || !newTextMatch) {
  console.error("Failed to parse issue body.");
  process.exit(1);
}

const langCode = langMatch[1].trim().split(' ')[0];
const currentText = currentTextMatch[1].trim();
const newText = newTextMatch[1].trim();

console.log(`Language: ${langCode}`);
console.log(`Current Text: ${currentText}`);
console.log(`New Text: ${newText}`);

const localesDir = path.join(__dirname, '../../public/_locales');
const jsonPath = path.join(localesDir, langCode, 'messages.json');

if (!fs.existsSync(jsonPath)) {
  console.error(`Translations file not found for language: ${langCode}`);
  process.exit(1);
}

const content = fs.readFileSync(jsonPath, 'utf8');
let json = JSON.parse(content);

let replaced = false;

for (const key in json) {
  if (json[key].message === currentText) {
    json[key].message = newText;
    replaced = true;
    break;
  }
}

if (!replaced) {
  console.error("Could not find the 'Current Text' in the JSON file.");
  process.exit(1);
}

fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log("Translation updated successfully!");
