// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';

/**
 * Search the Bible
 * @param {string} query - Search term (e.g., "John 3:16", "faith")
 * @returns {Promise} Search results
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
        return data;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

/**
 * Get a summary of a verse (truncated if too long)
 * @param {Object} verse - Verse object from search results
 * @param {number} maxLength - Maximum length of summary
 * @returns {string} Truncated verse text
 */
export function getVerseSummary(verse, maxLength = 200) {
    if (!verse || !verse.text) return '';
    return verse.text.length > maxLength 
        ? verse.text.substring(0, maxLength) + '...' 
        : verse.text;
}

/**
 * Format search results for display
 * @param {Object} results - Raw search results from API
 * @returns {Object} Formatted results
 */
export function formatSearchResults(results) {
    if (!results) return null;
    
    return {
        ...results,
        totalResults: results.results?.length || 0,
        hasResults: results.results?.length > 0,
        results: results.results?.map(verse => ({
            ...verse,
            displayText: cleanVerseText(verse.text)
        })) || []
    };
}

/**
 * Clean a single verse text (frontend version)
 * @param {string} text - Raw verse text
 * @returns {string} Cleaned verse text
 */
function cleanVerseText(text) {
    if (!text) return '';
    
    // If backend already cleaned, just return
    if (!text.includes('\\+w')) return text;
    
    return text
        .replace(/\\\+w/g, '')
        .replace(/\|strong="G\d+"\\w\*/g, '')
        .replace(/\s+/g, ' ')
        .replace(/ \./g, '.')
        .replace(/ ,/g, ',')
        .replace(/\s+([.,!?:;])/g, '$1')
        .trim();
}