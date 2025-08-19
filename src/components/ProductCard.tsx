'use client'

import { Package, Star, ShieldCheck, AlertTriangle } from 'lucide-react'
import { TrustScore } from './TrustScore'
import Image from 'next/image'

interface ProductCardProps {
  product: {
    id: number
    brand_name: string
    full_name: string
    image_url?: string | null
    trust_score: number
    trust_category: string
    usp_verified?: boolean
    nsf_certified?: boolean
    informed_sport?: boolean
    fda_flagged?: boolean
  }
  onClick?: () => void
  compact?: boolean
}

export default function ProductCard({ product, onClick, compact = false }: ProductCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} flex-shrink-0`}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.full_name}
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="text-gray-400" size={compact ? 24 : 32} />
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {product.brand_name}
          </h3>
          <p className={`text-gray-600 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {product.full_name}
          </p>
          
          {/* Trust Score */}
          <div className="flex items-center gap-2 mt-2">
            <TrustScore score={product.trust_score} size="sm" />
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
              {product.trust_category}
            </span>
          </div>
          
          {/* Certification Badges */}
          {!compact && (
            <div className="flex gap-1 mt-2">
              {product.usp_verified && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  <ShieldCheck size={10} />
                  USP
                </span>
              )}
              {product.nsf_certified && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  <ShieldCheck size={10} />
                  NSF
                </span>
              )}
              {product.informed_sport && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  <Star size={10} />
                  Sport
                </span>
              )}
              {product.fda_flagged && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  <AlertTriangle size={10} />
                  FDA
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}