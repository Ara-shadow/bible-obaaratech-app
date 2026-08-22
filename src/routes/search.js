// routes/search.js
import { prisma } from "../lib/prisma.js";
import { aiComplete } from "../lib/ai.js";
import { BIBLE_AI_SAFEGUARD_PROMPT } from "../lib/safeguard-prompt.js";
import { cleanBibleText } from "../lib/clean-text.js"; // ← ADD THIS LINE

export async function searchPassages(query) {
    // ... all your existing search code ...
    
    // ADD THIS CLEANING CODE BEFORE THE RETURN
    // Clean the text for all results
    export async function searchPassages(query) {
    // ... your existing code to get results ...
    
    // CLEAN THE TEXT BEFORE RETURNING
    const cleanedResults = results.map(result => ({
        ...result,
        text: cleanBibleText(result.text)
    }));
    
    // Clean byTestament
    const cleanByTestament = {
        OT: byTestament.OT.map(r => ({ ...r, text: cleanBibleText(r.text) })),
        NT: byTestament.NT.map(r => ({ ...r, text: cleanBibleText(r.text) }))
    };
    
    // Clean byGenre
    const cleanByGenre = {};
    for (const genre in byGenre) {
        cleanByGenre[genre] = byGenre[genre].map(r => ({ 
            ...r, 
            text: cleanBibleText(r.text) 
        }));
    }
    
    return {
        query,
        expandedTerms,
        results: cleanedResults,
        byTestament: cleanByTestament,
        byGenre: cleanByGenre
    };
}