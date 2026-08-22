// src/utils/cleanText.js
export function cleanBibleText(text) {
    if (!text) return '';

    return text
        // Remove \w tags
        .replace(/\\\+w/g, '')
        // Remove |strong="GXXXXX"\w* patterns
        .replace(/\|strong="G\d+"\\w\*/g, '')
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        // Fix punctuation spacing
        .replace(/ \./g, '.')
        .replace(/ ,/g, ',')
        .replace(/ ;/g, ';')
        .replace(/ :/g, ':')
        // Remove spaces before punctuation
        .replace(/\s+([.,!?:;])/g, '$1')
        // Remove any remaining backslashes
        .replace(/\\/g, '')
        .trim();
}