'use client'

import { useState } from 'react'
import { Camera, Package, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

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
  upc: string
}

export default function ScanPage() {
  const [upcInput, setUpcInput] = useState('')
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!upcInput || upcInput.length < 8) {
      setError('Please enter a valid UPC code')
      return
    }

    setLoading(true)
    setError('')
    setScannedProduct(null)

    try {
      const { data, error } = await supabase
        .rpc('search_supplements', { 
          query: upcInput.replace(/\D/g, ''), // Remove non-digits
          limit_count: 1 
        })

      if (error) {
        console.error('Scan error:', error)
        setError('Failed to scan product')
        return
      }

      if (data && data.length > 0) {
        setScannedProduct(data[0])
      } else {
        setError('Product not found. Try searching by name.')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setError('An error occurred while scanning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Scan Product</h1>

      {/* Scanner UI */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-full aspect-square max-w-xs mx-auto mb-4 border-2 border-white/30 rounded-xl flex items-center justify-center bg-black/20">
            <div className="text-center text-white">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Camera scanner not available in demo</p>
              <p className="text-xs opacity-50 mt-1">Enter UPC manually below</p>
            </div>
          </div>
          
          {/* Manual UPC Input */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter UPC code (e.g., 765704991183)"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur text-white placeholder-white/50 rounded-xl border border-white/20 focus:outline-none focus:border-white/40"
              value={upcInput}
              onChange={(e) => setUpcInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Scan Product'}
            </button>
          </div>
        </div>
        
        {/* Decorative scan lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Scanned Product */}
      {scannedProduct && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Found!</h2>
          <ProductCard 
            product={scannedProduct}
            onClick={() => window.location.href = `/product/${scannedProduct.id}`}
          />
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.location.href = `/product/${scannedProduct.id}`}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => {
                setScannedProduct(null)
                setUpcInput('')
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Sample UPCs for Testing */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Sample UPCs for Testing:</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <p>• 765704991183 - Herbs Etc. Kidalin</p>
          <p>• 074312706400 - Vitamin World B-2</p>
          <p>• Enter any 8-14 digit number to test</p>
        </div>
      </div>
    </div>
  )
}