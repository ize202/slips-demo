'use client'

import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2, Info } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

type StackProduct = {
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

export default function StackPage() {
  const [stackProducts, setStackProducts] = useState<StackProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load stack from localStorage (in real app, this would be from database)
    const loadStack = () => {
      const saved = localStorage.getItem('userStack')
      if (saved) {
        try {
          const products = JSON.parse(saved)
          setStackProducts(products)
        } catch (e) {
          console.error('Failed to load stack:', e)
        }
      }
      setLoading(false)
    }
    
    loadStack()
    
    // Listen for stack updates from other tabs/windows
    const handleStorageChange = () => {
      loadStack()
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const removeFromStack = (productId: number) => {
    const updated = stackProducts.filter(p => p.id !== productId)
    setStackProducts(updated)
    localStorage.setItem('userStack', JSON.stringify(updated))
  }

  const clearStack = () => {
    if (confirm('Are you sure you want to clear your entire stack?')) {
      setStackProducts([])
      localStorage.removeItem('userStack')
    }
  }

  const totalTrustScore = stackProducts.length > 0
    ? Math.round(stackProducts.reduce((sum, p) => sum + p.trust_score, 0) / stackProducts.length)
    : 0

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Stack</h1>
        {stackProducts.length > 0 && (
          <button
            onClick={clearStack}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      {stackProducts.length === 0 ? (
        <div className="text-center py-12">
          <Layers size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your stack is empty</h2>
          <p className="text-gray-600 mb-6">
            Add supplements to track what you're taking
          </p>
          <button
            onClick={() => window.location.href = '/search'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Find Products
          </button>
        </div>
      ) : (
        <>
          {/* Stack Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stack Overview</p>
                <p className="text-2xl font-bold">{stackProducts.length} Products</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Avg Trust Score</p>
                <p className="text-2xl font-bold">{totalTrustScore}/100</p>
              </div>
            </div>
          </div>

          {/* Stack Products */}
          <div className="space-y-3">
            {stackProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard 
                  product={product}
                  onClick={() => window.location.href = `/product/${product.id}`}
                />
                <button
                  onClick={() => removeFromStack(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {/* Stack Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.href = '/search'}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add More Products
            </button>
            
            {/* In a real app, this would show interaction warnings */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Stack Analysis</p>
                  <p className="text-xs text-blue-700 mt-1">
                    No interactions detected. Always consult with a healthcare provider before starting new supplements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}