// frontend/src/services/api.js

// Clean function - removes Strong's numbers from Bible text
function cleanBibleText(text) {
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

// API URL - change this to your backend URL
// For development:
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

// For production:
// const API_URL = 'https://bible.obaaratech.com.ng';

/**
 * Search the Bible
 * @param {string} query - Search term (e.g., "John 3:16", "faith")
 * @returns {Promise} Search results with cleaned text
 */
export async function searchBible(query) {
    if (!query || query.trim() === '') {
        throw new Error('Please enter a search query');
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${API_URL}/api/search?q=${encodedQuery}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();

        // 🧹 CLEAN THE TEXT - THIS IS THE IMPORTANT PART
        if (data.results) {
            data.results = data.results.map(verse => ({
                ...verse,
                text: cleanBibleText(verse.text) // Clean each verse
            }));
        }

        // Also clean byTestament if it exists
        if (data.byTestament) {
            if (data.byTestament.OT) {
                data.byTestament.OT = data.byTestament.OT.map(verse => ({
                    ...verse,
                    text: cleanBibleText(verse.text)
                }));
            }
            if (data.byTestament.NT) {
                data.byTestament.NT = data.byTestament.NT.map(verse => ({
                    ...verse,
                    text: cleanBibleText(verse.text)
                }));
            }
        }

        // Also clean byGenre if it exists
        if (data.byGenre) {
            for (const genre in data.byGenre) {
                data.byGenre[genre] = data.byGenre[genre].map(verse => ({
                    ...verse,
                    text: cleanBibleText(verse.text)
                }));
            }
        }

        return data;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

/**
 * Get a summary of a verse (truncated if too long)
 */
export function getVerseSummary(verse, maxLength = 200) {
    if (!verse || !verse.text) return '';
    return verse.text.length > maxLength
        ? verse.text.substring(0, maxLength) + '...'
        : verse.text;
}