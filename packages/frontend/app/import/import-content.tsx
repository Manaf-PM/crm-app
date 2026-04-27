'use client'

import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
}

export default function ImportContent() {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<ImportResult>('/api/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
      qc.invalidateQueries({ queryKey: ['clients'] })
    } catch {
      setError("Erreur lors de l'import. Vérifie le format du fichier.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Import CSV</h1>
      <p className="text-sm text-gray-500 mb-6">
        Importe une liste de clients depuis un fichier CSV.
      </p>

      {/* Format attendu */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-xs font-medium text-gray-700 mb-2">Format attendu (en-têtes) :</p>
        <code className="text-xs text-gray-600">
          prenom, nom, email, telephone, date_naissance, consentement_email, consentement_sms
        </code>
        <p className="text-xs text-gray-400 mt-2">
          consentement_email et consentement_sms : oui/non ou 1/0
        </p>
      </div>

      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} Ko</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">Glisse un fichier CSV ici</p>
            <p className="text-xs text-gray-400 mt-1">ou clique pour parcourir</p>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Import en cours...' : 'Importer'}
        </button>
      )}

      {result && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-700">
            {result.imported} client{result.imported !== 1 ? 's' : ''} importé{result.imported !== 1 ? 's' : ''}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-red-600 mb-2">{result.errors.length} erreur(s) :</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-500">Ligne {e.row} : {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  )
}
