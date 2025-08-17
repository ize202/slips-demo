'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, BarChart, Package, Database, Zap, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TrustScore } from '@/components/TrustScore'
import Link from 'next/link'

type SearchResult = {
  id: number
  brand_name: string
  full_name: string
  image_url: string | null
  product_url: string | null
  trust_score: number
  trust_category: string
  usp_verified: boolean
  nsf_certified: boolean
  informed_sport: boolean
  fda_flagged: boolean
}

type DBStats = {
  totalProducts: number
  totalScores: number
  avgScore: number
  distribution: Record<string, number>
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [dbStats, setDbStats] = useState<DBStats | null>(null)
  const [useMatView, setUseMatView] = useState(true)

  // Fetch database statistics
  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total counts
        const [labelsCount, scoresCount] = await Promise.all([
          supabase.from('labels').select('*', { count: 'exact', head: true }),
          supabase.from('trustscores').select('*', { count: 'exact', head: true })
        ])

        // Get score statistics
        const { data: scoreStats } = await supabase
          .from('trustscores')
          .select('score, category')

        if (scoreStats) {
          const distribution = scoreStats.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          const avgScore = scoreStats.reduce((sum, item) => sum + item.score, 0) / scoreStats.length

          setDbStats({
            totalProducts: labelsCount.count || 0,
            totalScores: scoresCount.count || 0,
            avgScore: Math.round(avgScore),
            distribution
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
  }, [])

  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const startTime = performance.now()

    try {
      let query;
      
      if (useMatView) {
        // Use the fast materialized view (if migration was applied)
        const { data: viewExists } = await supabase
          .from('product_search')
          .select('id')
          .limit(1)

        if (viewExists) {
          // Use materialized view with full-text search
          const { data, error } = await supabase
            .rpc('search_products', { 
              query_text: term,
              limit_count: 20 
            })

          const endTime = performance.now()
          setQueryTime(endTime - startTime)

          if (!error && data) {
            setResults(data)
            return
          }
        }
      }

      // Fallback to direct table query
      const { data, error } = await supabase
        .from('labels')
        .select(`
          id,
          brand_name,
          full_name,
          trustscores!inner(score, category),
          products(image_url, product_url),
          verification(usp_verified, nsf_certified, informed_sport, fda_flagged)
        `)
        .or(`brand_name.ilike.%${term}%,full_name.ilike.%${term}%`)
        .order('trustscores(score)', { ascending: false })
        .limit(20)

      const endTime = performance.now()
      setQueryTime(endTime - startTime)

      if (error) {
        console.error('Search error:', error)
        setResults([])
        return
      }

      // Transform nested data
      const transformed = (data || []).map(item => ({
        id: item.id,
        brand_name: item.brand_name,
        full_name: item.full_name,
        image_url: item.products?.[0]?.image_url || null,
        product_url: item.products?.[0]?.product_url || null,
        trust_score: item.trustscores?.[0]?.score || 50,
        trust_category: item.trustscores?.[0]?.category || 'Fair',
        usp_verified: item.verification?.[0]?.usp_verified || false,
        nsf_certified: item.verification?.[0]?.nsf_certified || false,
        informed_sport: item.verification?.[0]?.informed_sport || false,
        fda_flagged: item.verification?.[0]?.fda_flagged || false
      }))

      setResults(transformed)
    } catch (error: any) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [useMatView])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchProducts(searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, searchProducts])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Slips Demo - Simplified Architecture</h1>
          <p className="text-gray-600">Testing automatic trustscore calculation with verification table</p>
        </div>

        {/* Database Stats */}
        {dbStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database size={20} />
              Database Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{dbStats.totalProducts.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Products Scored</p>
                <p className="text-2xl font-bold">{dbStats.totalScores.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  {((dbStats.totalScores / dbStats.totalProducts) * 100).toFixed(1)}% coverage
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{dbStats.avgScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Distribution</p>
                <div className="text-xs space-y-1">
                  {Object.entries(dbStats.distribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([cat, count]) => (
                      <div key={cat}>
                        {cat}: {((count / dbStats.totalScores) * 100).toFixed(1)}%
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Controls */}
        <div className="flex gap-4 justify-center mb-8">
          <Link href="/stress-test" className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            <Zap size={20} />
            Stress Test
          </Link>
          <Link href="/metrics" className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <BarChart size={20} />
            Performance Metrics
          </Link>
          <button
            onClick={() => setUseMatView(!useMatView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              useMatView ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Database size={20} />
            {useMatView ? 'Using Mat View' : 'Using Direct Query'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search supplements by brand or product name..."
            className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {queryTime !== null && (
          <div className="text-center text-sm text-gray-500 mb-4">
            Query time: <span className={queryTime < 50 ? 'text-green-600' : queryTime < 100 ? 'text-yellow-600' : 'text-red-600'}>
              {queryTime.toFixed(2)}ms
            </span>
            {queryTime < 50 && ' ⚡ Fast'}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Search Results */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.full_name}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="text-gray-400" size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.brand_name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.full_name}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <TrustScore score={product.trust_score} size="sm" />
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      product.trust_category === 'Excellent' ? 'bg-green-100 text-green-800' :
                      product.trust_category === 'Very Good' ? 'bg-emerald-100 text-emerald-800' :
                      product.trust_category === 'Good' ? 'bg-blue-100 text-blue-800' :
                      product.trust_category === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                      product.trust_category === 'Below Average' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.trust_category}
                    </span>
                  </div>

                  {/* Certification badges */}
                  <div className="flex flex-wrap gap-1">
                    {product.usp_verified && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">USP</span>
                    )}
                    {product.nsf_certified && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">NSF</span>
                    )}
                    {product.informed_sport && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Sport</span>
                    )}
                    {product.fda_flagged && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle size={10} />
                        FDA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchTerm && !loading && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found for "{searchTerm}"
          </div>
        )}
      </div>
    </main>
  )
}