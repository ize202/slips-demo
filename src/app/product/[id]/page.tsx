'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Check, Shield, AlertTriangle, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TrustScore } from '@/components/TrustScore'

type ProductDetail = {
  id: number
  brand_name: string
  full_name: string
  upc: string
  product_type: string
  trust_score: number
  trust_category: string
  image_url: string | null
  product_url: string | null
  off_market: number
  certifications: {
    usp_verified: boolean
    nsf_certified: boolean
    informed_sport: boolean
    informed_choice: boolean
    bscg: boolean
    clean_label: boolean
    non_gmo: boolean
    usda_organic: boolean
    fda_flagged: boolean
  }
  trust_breakdown: {
    base_score: number
    certifications_bonus: number
    fda_penalty: number
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [inStack, setInStack] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return

      try {
        const { data, error } = await supabase
          .rpc('get_product_details', { product_id: parseInt(params.id as string) })

        if (error) {
          console.error('Error fetching product:', error)
          return
        }

        setProduct(data)

        // Check if in stack
        const saved = localStorage.getItem('userStack')
        if (saved) {
          const stack = JSON.parse(saved)
          setInStack(stack.some((p: any) => p.id === parseInt(params.id as string)))
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const toggleStack = () => {
    if (!product) return

    const saved = localStorage.getItem('userStack')
    let stack = saved ? JSON.parse(saved) : []

    if (inStack) {
      stack = stack.filter((p: any) => p.id !== product.id)
    } else {
      stack.push({
        id: product.id,
        brand_name: product.brand_name,
        full_name: product.full_name,
        image_url: product.image_url,
        trust_score: product.trust_score,
        trust_category: product.trust_category,
        usp_verified: product.certifications.usp_verified,
        nsf_certified: product.certifications.nsf_certified,
        informed_sport: product.certifications.informed_sport,
        fda_flagged: product.certifications.fda_flagged
      })
    }

    localStorage.setItem('userStack', JSON.stringify(stack))
    setInStack(!inStack)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="px-4 py-6">
        <p className="text-center text-gray-600">Product not found</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Product Details</h1>
      </div>

      {/* Product Image and Basic Info */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex gap-4 mb-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.full_name}
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield size={32} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{product.brand_name}</h2>
            <p className="text-gray-600 text-sm">{product.full_name}</p>
            <p className="text-xs text-gray-500 mt-1">UPC: {product.upc}</p>
          </div>
        </div>

        {/* Trust Score */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Trust Score</span>
            <span className="text-sm text-gray-500">{product.trust_category}</span>
          </div>
          <TrustScore score={product.trust_score} size="lg" />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Score Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Score</span>
            <span className="font-medium">{product.trust_breakdown.base_score}</span>
          </div>
          {product.trust_breakdown.certifications_bonus > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Certifications</span>
              <span className="font-medium text-green-600">
                +{product.trust_breakdown.certifications_bonus}
              </span>
            </div>
          )}
          {product.trust_breakdown.fda_penalty < 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">FDA Issues</span>
              <span className="font-medium text-red-600">
                {product.trust_breakdown.fda_penalty}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold pt-2 border-t">
            <span>Total Score</span>
            <span>{product.trust_score}/100</span>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Certifications</h3>
        <div className="space-y-2">
          {product.certifications.usp_verified && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>USP Verified</span>
            </div>
          )}
          {product.certifications.nsf_certified && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>NSF Certified</span>
            </div>
          )}
          {product.certifications.informed_sport && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>Informed Sport</span>
            </div>
          )}
          {product.certifications.clean_label && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>Clean Label Project</span>
            </div>
          )}
          {product.certifications.non_gmo && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>Non-GMO Verified</span>
            </div>
          )}
          {product.certifications.usda_organic && (
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-green-600" />
              <span>USDA Organic</span>
            </div>
          )}
          {product.certifications.fda_flagged && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={16} />
              <span>FDA Warning Issued</span>
            </div>
          )}
          {!Object.values(product.certifications).some(v => v) && (
            <p className="text-sm text-gray-500">No certifications found</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={toggleStack}
          className={`w-full py-3 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
            inStack 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {inStack ? (
            <>
              <Check size={20} />
              In Your Stack
            </>
          ) : (
            <>
              <Plus size={20} />
              Add to Stack
            </>
          )}
        </button>
        
        {product.product_url && (
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={20} />
            View on Website
          </a>
        )}
      </div>

      {/* Status Warning */}
      {product.off_market === 1 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            ⚠️ This product may be discontinued or off-market
          </p>
        </div>
      )}
    </div>
  )
}