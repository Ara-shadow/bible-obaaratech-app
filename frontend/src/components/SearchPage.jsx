// frontend/src/components/SearchPage.jsx
import React, { useState } from 'react';
import { searchBible } from '../services/api';

export function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!query.trim()) {
            setError('Please enter a search term');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const data = await searchBible(query);
            setResults(data);
            console.log('✅ Clean results:', data); // Debug log
        } catch (err) {
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-page">
            <div className="search-header">
                <h1>📖 Bible Search</h1>
                <p>Search Scripture and discover related passages</p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., John 3:16, faith, love, peace..."
                        disabled={loading}
                        autoFocus
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Searching...' : '🔍 Search'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="error-message">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Searching the Scriptures...</p>
                </div>
            )}

            {results && results.results && results.results.length > 0 && (
                <div className="results-container">
                    <div className="results-stats">
                        <span>Found {results.results.length} verses</span>
                        {results.byTestament && (
                            <div className="testament-stats">
                                <span className="ot">OT: {results.byTestament.OT?.length || 0}</span>
                                <span className="nt">NT: {results.byTestament.NT?.length || 0}</span>
                            </div>
                        )}
                    </div>

                    <div className="results-grid">
                        {results.results.map((verse, index) => (
                            <div key={`${verse.reference}-${index}`} className="verse-card">
                                <div className="verse-header">
                                    <h3>{verse.reference}</h3>
                                    <div className="verse-tags">
                                        <span className="tag testament">{verse.testament}</span>
                                        <span className="tag genre">{verse.genre}</span>
                                    </div>
                                </div>
                                <p className="verse-text">{verse.text}</p>
                                {/* ✅ Now shows clean text! */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results && results.results && results.results.length === 0 && (
                <div className="empty-state">
                    <span>📭</span>
                    <h3>No results found</h3>
                    <p>Try different keywords or check your spelling</p>
                </div>
            )}
        </div>
    );
}