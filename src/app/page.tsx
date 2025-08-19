'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Shield, Star, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

type Product = {
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
  suggestion_type?: string
}

export default function HomePage() {
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Get suggested products (mix of popular and high-rated)
        const { data, error } = await supabase
          .rpc('get_suggested_products')
        
        if (error) {
          console.error('Error fetching products:', error)
        } else {
          setSuggestedProducts(data || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Split products into popular and top-rated
  const popularProducts = suggestedProducts.filter(p => p.suggestion_type === 'popular')
  const topRatedProducts = suggestedProducts.filter(p => p.suggestion_type === 'top_rated')

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Slips</h1>
        <p className="text-gray-600 mt-1">Discover trusted supplements</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link 
          href="/search"
          className="bg-purple-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Shield size={24} />
          <span className="font-medium">Search Products</span>
        </Link>
        <Link 
          href="/scan"
          className="bg-indigo-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Star size={24} />
          <span className="font-medium">Scan Barcode</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Suggested Products Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Suggested Products</h2>
            </div>
            
            {/* Popular Brands */}
            {popularProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Popular Brands</p>
                <div className="space-y-3">
                  {popularProducts.slice(0, 3).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      onClick={() => window.location.href = `/product/${product.id}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Rated */}
            {topRatedProducts.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Highly Rated</p>
                <div className="space-y-3">
                  {topRatedProducts.slice(0, 3).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      onClick={() => window.location.href = `/product/${product.id}`}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fallback if no products */}
            {suggestedProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No suggested products available</p>
                <Link href="/search" className="text-purple-600 hover:text-purple-700 mt-2 inline-block">
                  Browse all products →
                </Link>
              </div>
            )}
          </section>

          {/* Stats Bar */}
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">205K+</p>
                <p className="text-xs text-gray-600">Products</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">15+</p>
                <p className="text-xs text-gray-600">Certifications</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-xs text-gray-600">Transparent</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}