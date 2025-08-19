'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

type SearchResult = {
  id: number
  brand_name: string
  full_name: string
  image_url: string | null
  trust_score: number
  trust_category: string
  usp_verified: boolean
  nsf_certified: boolean
  informed_sport: boolean
  fda_flagged: boolean
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Popular search suggestions
  const suggestions = [
    'Protein Powder',
    'Creatine',
    'Pre-Workout',
    'Vitamins',
    'Omega 3',
    'BCAA'
  ]

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('search_supplements', { 
          query: term,
          limit_count: 20 
        })

      if (error) {
        console.error('Search error:', error)
        setResults([])
        return
      }

      setResults(data || [])
      
      // Save to recent searches
      const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
      setRecentSearches(newRecent)
      localStorage.setItem('recentSearches', JSON.stringify(newRecent))
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [recentSearches])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        searchProducts(searchTerm)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, searchProducts])

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    searchProducts(suggestion)
  }

  return (
    <div className="px-4 py-6">
      {/* Search Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Products</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by brand or product..."
            className="w-full pl-10 pr-10 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions or Results */}
      {!searchTerm && !loading && (
        <>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-2">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm rounded-full hover:bg-purple-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchTerm && (
        <div>
          {results.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Found {results.length} products
              </p>
              <div className="space-y-3">
                {results.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onClick={() => window.location.href = `/product/${product.id}`}
                  />
                ))}
              </div>
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found for "{searchTerm}"</p>
              <p className="text-sm text-gray-400 mt-1">Try searching for a brand or product type</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}