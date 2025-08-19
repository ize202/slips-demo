'use client'

import { useState } from 'react'
import { Zap, Database, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type TestResult = {
  name: string
  duration: number
  success: boolean
  error?: string
  details?: any
}

export default function StressTest() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>('')

  async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    setCurrentTest(name)
    const startTime = performance.now()
    
    try {
      const details = await testFn()
      const duration = performance.now() - startTime
      return { name, duration, success: true, details }
    } catch (error: any) {
      const duration = performance.now() - startTime
      return { name, duration, success: false, error: error.message }
    }
  }

  async function runAllTests() {
    setRunning(true)
    setResults([])
    
    const testResults: TestResult[] = []

    // Test 1: Basic connectivity
    testResults.push(await runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('labels').select('id').limit(1)
      if (error) throw error
      return { connected: true, sample: data }
    }))

    // Test 2: Count performance
    testResults.push(await runTest('Count 205k Products', async () => {
      const { count, error } = await supabase
        .from('labels')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return { count }
    }))

    // Test 3: TrustScore function test
    testResults.push(await runTest('Calculate TrustScore Function', async () => {
      const { data, error } = await supabase
        .rpc('calculate_simple_trustscore', { p_product_id: 1 })
      if (error) throw error
      return { score: data }
    }))

    // Test 4: Search with optimized function
    testResults.push(await runTest('Optimized Search (vitamin c)', async () => {
      const { data, error } = await supabase
        .rpc('search_supplements', { 
          query: 'vitamin c',
          limit_count: 20 
        })
      if (error) throw error
      return { results: data?.length || 0, type: 'optimized' }
    }))

    // Test 5: Complex join query
    testResults.push(await runTest('Complex Join Query', async () => {
      const { data, error } = await supabase
        .from('labels')
        .select(`
          id, brand_name,
          trustscores(score, category),
          verification(usp_verified, nsf_certified),
          products(image_url)
        `)
        .limit(50)
      if (error) throw error
      return { results: data?.length || 0 }
    }))

    // Test 6: Trigger test - Update verification
    testResults.push(await runTest('Trigger Test (Update Verification)', async () => {
      // Pick a random product
      const productId = Math.floor(Math.random() * 1000) + 1
      
      // Get current score
      const { data: before } = await supabase
        .from('trustscores')
        .select('score')
        .eq('product_id', productId)
        .single()
      
      // Update verification
      await supabase
        .from('verification')
        .update({ usp_verified: true })
        .eq('product_id', productId)
      
      // Wait a bit for trigger
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Get new score
      const { data: after } = await supabase
        .from('trustscores')
        .select('score')
        .eq('product_id', productId)
        .single()
      
      // Revert change
      await supabase
        .from('verification')
        .update({ usp_verified: false })
        .eq('product_id', productId)
      
      return {
        productId,
        scoreBefore: before?.score,
        scoreAfter: after?.score,
        triggerWorked: (after?.score || 0) > (before?.score || 0)
      }
    }))

    // Test 7: Batch read performance
    testResults.push(await runTest('Batch Read (1000 products)', async () => {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .range(0, 999)
      if (error) throw error
      return { fetched: data?.length || 0 }
    }))

    // Test 8: Full-text search performance
    testResults.push(await runTest('Full-Text Search', async () => {
      const searches = ['protein', 'vitamin c', 'omega 3', 'probiotic', 'creatine']
      const results = []
      
      for (const term of searches) {
        const start = performance.now()
        const { data } = await supabase
          .from('labels')
          .select('id')
          .textSearch('search_text', term)
          .limit(10)
        const duration = performance.now() - start
        results.push({ term, found: data?.length || 0, ms: duration })
      }
      
      return { searches: results }
    }))

    // Test 9: Concurrent queries
    testResults.push(await runTest('10 Concurrent Queries', async () => {
      const queries = Array(10).fill(0).map((_, i) => 
        supabase.from('labels').select('id').range(i * 100, (i + 1) * 100 - 1)
      )
      
      const start = performance.now()
      const results = await Promise.all(queries)
      const duration = performance.now() - start
      
      return { 
        totalRows: results.reduce((sum, r) => sum + (r.data?.length || 0), 0),
        avgTimePerQuery: duration / 10
      }
    }))

    // Test 10: Score distribution
    testResults.push(await runTest('Score Distribution Query', async () => {
      const { data, error } = await supabase
        .from('trustscores')
        .select('category')
        .limit(10000)
      
      if (error) throw error
      
      const distribution = (data || []).reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return distribution
    }))

    setResults(testResults)
    setCurrentTest('')
    setRunning(false)
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const successCount = results.filter(r => r.success).length
  const avgDuration = results.length > 0 ? totalDuration / results.length : 0

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Stress Test</h1>
            <p className="text-gray-600">Test the performance of the simplified architecture</p>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Search
          </Link>
        </div>

        {/* Summary Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{results.length - successCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold">{avgDuration.toFixed(0)}ms</p>
            </div>
          </div>
        )}

        {/* Run Button */}
        <div className="text-center mb-8">
          <button
            onClick={runAllTests}
            disabled={running}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              running 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {running ? (
              <>
                <Activity className="animate-pulse" size={20} />
                Running: {currentTest}
              </>
            ) : (
              <>
                <Zap size={20} />
                Run All Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {results.map((result, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="text-green-500 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-500 mt-1" size={20} />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-sm text-gray-600">
                      Duration: <span className={
                        result.duration < 100 ? 'text-green-600' :
                        result.duration < 500 ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {result.duration.toFixed(2)}ms
                      </span>
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
                    )}
                    {result.details && (
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Tips */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle size={20} />
            Performance Notes
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• The materialized view (product_search) should give &lt;50ms search times</li>
            <li>• Direct table queries will be slower (~100-200ms) but still acceptable</li>
            <li>• Triggers ensure trustscores update automatically when verification changes</li>
            <li>• All 205,782 products should have scores if migrations were applied</li>
            <li>• The calculate_simple_trustscore function uses verification booleans</li>
          </ul>
        </div>
      </div>
    </main>
  )
}