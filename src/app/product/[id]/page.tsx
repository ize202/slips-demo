'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TrustScore } from '@/components/TrustScore'
import Link from 'next/link'

type ProductDetail = {
  id: number
  brand_name: string
  full_name: string
  upc: string
  product_type: string
  entry_date: string
  off_market: number
  image_url: string | null
  product_url: string | null
  trust_score: number
  certifications: {
    name: string
    value: boolean
  }[]
  fda_recall: {
    number: string
    url: string
  } | null
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('labels')
          .select(`
            id,
            brand_name,
            full_name,
            upc,
            product_type,
            entry_date,
            off_market,
            products(image_url, product_url),
            verification(
              usp_verified,
              informed_sport,
              informed_choice,
              nsf_certified,
              fda_flagged,
              bscg,
              ifos,
              ikos,
              iaos,
              ipro,
              igen,
              clean_label_project_certified,
              non_gmo_certified,
              gf_certified,
              usda_organic_certified,
              vegan_action_certified,
              fda_recall_number,
              fda_recall_url
            )
          `)
          .eq('id', params.id)
          .single()

        if (error || !data) {
          setError('Product not found')
          return
        }

        const certs = data.verification?.[0] || {}
        
        const certifications = [
          { name: 'USP Verified', value: certs.usp_verified },
          { name: 'Informed Sport', value: certs.informed_sport },
          { name: 'Informed Choice', value: certs.informed_choice },
          { name: 'NSF Certified', value: certs.nsf_certified },
          { name: 'BSCG', value: certs.bscg },
          { name: 'IFOS', value: certs.ifos },
          { name: 'IKOS', value: certs.ikos },
          { name: 'IAOS', value: certs.iaos },
          { name: 'IPRO', value: certs.ipro },
          { name: 'iGen', value: certs.igen },
          { name: 'Clean Label', value: certs.clean_label_project_certified },
          { name: 'Non-GMO', value: certs.non_gmo_certified },
          { name: 'Gluten Free', value: certs.gf_certified },
          { name: 'USDA Organic', value: certs.usda_organic_certified },
          { name: 'Vegan', value: certs.vegan_action_certified }
        ]

        const certCount = [
          certs.usp_verified,
          certs.informed_sport,
          certs.informed_choice,
          certs.nsf_certified,
          certs.bscg,
          certs.ifos
        ].filter(Boolean).length

        const trustScore = Math.min(100, Math.max(0, 
          50 + (certCount * 10) - (certs.fda_flagged ? 50 : 0) - (data.off_market === 1 ? 15 : 0)
        ))

        setProduct({
          id: data.id,
          brand_name: data.brand_name,
          full_name: data.full_name,
          upc: data.upc,
          product_type: data.product_type,
          entry_date: data.entry_date,
          off_market: data.off_market,
          image_url: data.products?.[0]?.image_url,
          product_url: data.products?.[0]?.product_url,
          trust_score: trustScore,
          certifications,
          fda_recall: certs.fda_recall_number ? {
            number: certs.fda_recall_number,
            url: certs.fda_recall_url
          } : null
        })
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6">
            <ArrowLeft size={20} />
            Back to Search
          </Link>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6">
          <ArrowLeft size={20} />
          Back to Search
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex gap-6 mb-6">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.full_name}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <Package className="text-gray-400" size={64} />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.brand_name}</h1>
              <p className="text-xl text-gray-700 mb-4">{product.full_name}</p>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">UPC:</span> {product.upc}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Type:</span> {product.product_type}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Entry Date:</span> {new Date(product.entry_date).toLocaleDateString()}
                </p>
                {product.off_market === 1 && (
                  <p className="text-sm text-red-600 font-semibold">
                    This product is off market
                  </p>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Trust Score</p>
                <TrustScore score={product.trust_score} size="lg" />
              </div>

              {product.product_url && (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  View Product Online
                </a>
              )}
            </div>
          </div>

          {product.fda_recall && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-600" size={20} />
                <h3 className="text-lg font-semibold text-red-900">FDA Recall</h3>
              </div>
              <p className="text-sm text-red-800">
                Recall Number: {product.fda_recall.number}
              </p>
              {product.fda_recall.url && (
                <a
                  href={product.fda_recall.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:underline"
                >
                  View recall details →
                </a>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Certifications & Verifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {product.certifications.map((cert) => (
                <div
                  key={cert.name}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    cert.value ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {cert.value ? (
                    <CheckCircle className="text-green-600" size={18} />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${cert.value ? 'text-green-900 font-medium' : 'text-gray-500'}`}>
                    {cert.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}