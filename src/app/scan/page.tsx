'use client'

import { useState } from 'react'
import { Scan, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TrustScore } from '@/components/TrustScore'
import Link from 'next/link'

type ProductDetail = {
  id: number
  brand_name: string
  full_name: string
  upc: string
  image_url: string | null
  product_url: string | null
  trust_score: number
  certifications: string[]
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [error, setError] = useState('')
  const [scanTime, setScanTime] = useState<number | null>(null)

  const scanBarcode = async () => {
    if (!barcode.trim()) {
      setError('Please enter a barcode')
      return
    }

    setLoading(true)
    setError('')
    setProduct(null)
    const startTime = performance.now()

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          gtin,
          products(
            dsld_label_id,
            image_url,
            product_url,
            brand_name,
            canonical_name
          )
        `)
        .eq('gtin', barcode.trim())
        .single()

      if (error || !data) {
        setError('Product not found')
        setScanTime(performance.now() - startTime)
        return
      }

      const labelId = data.products?.dsld_label_id
      if (!labelId) {
        setError('Product details not available')
        return
      }

      const { data: labelData, error: labelError } = await supabase
        .from('labels')
        .select(`
          id,
          brand_name,
          full_name,
          upc,
          verification(
            usp_verified,
            informed_sport,
            informed_choice,
            nsf_certified,
            fda_flagged,
            bscg,
            ifos,
            clean_label_project_certified,
            non_gmo_certified,
            gf_certified,
            usda_organic_certified,
            vegan_action_certified
          )
        `)
        .eq('id', labelId)
        .single()

      if (labelError || !labelData) {
        setError('Could not fetch product details')
        return
      }

      const certs = labelData.verification?.[0] || {}
      const certifications = []
      
      if (certs.usp_verified) certifications.push('USP Verified')
      if (certs.informed_sport) certifications.push('Informed Sport')
      if (certs.informed_choice) certifications.push('Informed Choice')
      if (certs.nsf_certified) certifications.push('NSF Certified')
      if (certs.bscg) certifications.push('BSCG')
      if (certs.ifos) certifications.push('IFOS')
      if (certs.clean_label_project_certified) certifications.push('Clean Label')
      if (certs.non_gmo_certified) certifications.push('Non-GMO')
      if (certs.gf_certified) certifications.push('Gluten Free')
      if (certs.usda_organic_certified) certifications.push('USDA Organic')
      if (certs.vegan_action_certified) certifications.push('Vegan')

      const certCount = [
        certs.usp_verified,
        certs.informed_sport,
        certs.informed_choice,
        certs.nsf_certified,
        certs.bscg,
        certs.ifos
      ].filter(Boolean).length

      const trustScore = Math.min(100, Math.max(0, 
        50 + (certCount * 10) - (certs.fda_flagged ? 50 : 0)
      ))

      setProduct({
        id: labelData.id,
        brand_name: labelData.brand_name,
        full_name: labelData.full_name,
        upc: labelData.upc,
        image_url: data.products?.image_url,
        product_url: data.products?.product_url,
        trust_score: trustScore,
        certifications
      })

      setScanTime(performance.now() - startTime)
    } catch (err) {
      console.error('Scan error:', err)
      setError('An error occurred while scanning')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    scanBarcode()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6">
          <ArrowLeft size={20} />
          Back to Search
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Barcode Scanner</h1>
          <p className="text-gray-600">Enter a UPC/EAN barcode to look up product details</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter barcode (e.g., 733739030863)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Scan size={20} />
              Scan
            </button>
          </div>
        </form>

        {scanTime !== null && (
          <div className="text-center text-sm text-gray-500 mb-4">
            Lookup time: {scanTime.toFixed(2)}ms
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Scanning barcode...</p>
          </div>
        )}

        {product && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex gap-6 mb-6">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.full_name}
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                  <Scan className="text-gray-400" size={48} />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.brand_name}</h2>
                <p className="text-lg text-gray-700 mb-2">{product.full_name}</p>
                <p className="text-sm text-gray-500 mb-4">UPC: {product.upc}</p>
                <TrustScore score={product.trust_score} size="lg" />
              </div>
            </div>

            {product.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.product_url && (
              <div className="flex gap-4">
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  View Product
                </a>
                <Link
                  href={`/product/${product.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Full Details
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Try these barcodes:</p>
          <div className="flex gap-4 justify-center mt-2">
            <button
              onClick={() => setBarcode('733739030863')}
              className="text-blue-500 hover:underline"
            >
              733739030863
            </button>
            <button
              onClick={() => setBarcode('649908230104')}
              className="text-blue-500 hover:underline"
            >
              649908230104
            </button>
            <button
              onClick={() => setBarcode('031604014162')}
              className="text-blue-500 hover:underline"
            >
              031604014162
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}