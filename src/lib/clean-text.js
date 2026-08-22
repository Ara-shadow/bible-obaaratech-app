function cleanBibleText(text) {
  if (!text) return "";

  return text
    // Remove USFM word markers
    .replace(/\\\+w\s*/g, "")
    .replace(/\\\+w\*/g, "")

    // Remove Strong's numbers
    .replace(/\|strong="[^"]*"/g, "")

    // Remove any remaining Strong's attributes
    .replace(/\s*strong="[^"]*"/g, "")

    // Remove escaped characters
    .replace(/\\+/g, "")

    // Clean excessive spaces
    .replace(/\s+/g, " ")

    // Fix spaces before punctuation
    .replace(/\s+([,.!?;:])/g, "$1")

    .trim();
}
const cleanedResults = results.map(verse => ({
  ...verse,
  text: cleanBibleText(verse.text)
}));

return cleanedResults;