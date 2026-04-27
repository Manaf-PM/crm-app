'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, clientsApi } from '../../lib/api'

interface Template {
  id: string
  nom: string
  type: 'email' | 'sms'
  reason: string
  subject?: string
  body: string
}

interface SendResult {
  success: boolean
  template: string
  total: number
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

interface BirthdayResult {
  message: string
  sent: number
  failed: number
  skipped: number
  clients: string[]
}

const templatesApi = {
  list: () => api.get<Template[]>('/api/templates').then(r => r.data),
}

function preview(body: string, subject?: string) {
  const replace = (t: string) => t
    .replace(/{{prenom}}/g, 'Marie')
    .replace(/{{nom}}/g, 'Dupont')
    .replace(/{{email}}/g, 'marie@exemple.fr')
  return { body: replace(body), subject: subject ? replace(subject) : undefined }
}

export default function CampaignsContent() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<SendResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [birthdayResult, setBirthdayResult] = useState<BirthdayResult | null>(null)
  const [activeTab, setActiveTab] = useState<'manual' | 'birthday'>('manual')

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  })

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  })

  const sendMutation = useMutation({
    mutationFn: () => api.post<SendResult>('/api/campaigns/send', {
      templateId: selectedTemplate!.id,
      clientIds: Array.from(selectedIds),
    }).then(r => r.data),
    onSuccess: (data) => { setResult(data); setStep(3) },
  })

  const birthdayMutation = useMutation({
    mutationFn: () => api.post<BirthdayResult>('/api/jobs/birthday', {}).then(r => r.data),
    onSuccess: (data) => setBirthdayResult(data),
  })

  const eligibleClients = clients.filter(c =>
    selectedTemplate?.type === 'email' ? c.consentementEmail : c.consentementSms
  )

  function toggleClient(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === eligibleClients.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(eligibleClients.map(c => c.id)))
    }
  }

  function reset() {
    setStep(1)
    setSelectedTemplate(null)
    setSelectedIds(new Set())
    setResult(null)
    setShowPreview(false)
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Campagnes</h1>
        <p className="text-sm text-gray-500 mt-1">Envoi manuel ou automatique</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Envoi manuel
        </button>
        <button
          onClick={() => setActiveTab('birthday')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'birthday'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Anniversaires
        </button>
      </div>

      {/* ── ONGLET ANNIVERSAIRES ── */}
      {activeTab === 'birthday' && (
        <div>
          <div className="border border-gray-200 rounded-lg p-6 mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Job anniversaires</h2>
            <p className="text-sm text-gray-500 mb-4">
              Envoie automatiquement le template "Anniversaire" à tous les clients
              dont c'est l'anniversaire aujourd'hui. En production, ce job sera
              déclenché automatiquement chaque matin à 8h via Cloud Scheduler.
            </p>
            <button
              onClick={() => { setBirthdayResult(null); birthdayMutation.mutate() }}
              disabled={birthdayMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {birthdayMutation.isPending ? 'Envoi en cours...' : 'Lancer le job anniversaires'}
            </button>
          </div>

          {birthdayResult && (
            <div className={`rounded-lg p-4 border ${
              birthdayResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className="font-medium text-sm text-gray-900 mb-3">{birthdayResult.message}</p>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-xl font-semibold text-green-600">{birthdayResult.sent}</p>
                  <p className="text-xs text-gray-500 mt-1">Envoyé{birthdayResult.sent > 1 ? 's' : ''}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-yellow-600">{birthdayResult.skipped}</p>
                  <p className="text-xs text-gray-500 mt-1">Ignoré{birthdayResult.skipped > 1 ? 's' : ''}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-red-600">{birthdayResult.failed}</p>
                  <p className="text-xs text-gray-500 mt-1">Échoué{birthdayResult.failed > 1 ? 's' : ''}</p>
                </div>
              </div>
              {birthdayResult.clients.length > 0 && (
                <div className="border-t border-green-200 pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Clients contactés :</p>
                  {birthdayResult.clients.map((name, i) => (
                    <p key={i} className="text-xs text-gray-600">• {name}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET ENVOI MANUEL ── */}
      {activeTab === 'manual' && (
        <div>
          {/* Étapes */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: 'Template' },
              { n: 2, label: 'Destinataires' },
              { n: 3, label: 'Résultat' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s.n
                    ? 'bg-blue-600 text-white'
                    : step > s.n
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm ${step === s.n ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {s.n < 3 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {/* Étape 1 — Template */}
          {step === 1 && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">Choisis un template</h2>
              {loadingTemplates ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Aucun template disponible.{' '}
                  <a href="/templates" className="text-blue-600 hover:underline">Crée-en un d'abord.</a>
                </p>
              ) : (
                <div className="grid gap-2">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate?.id === t.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{t.nom}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.type === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.type === 'email' ? 'Email' : 'SMS'}
                        </span>
                      </div>
                      {t.subject && <p className="text-xs text-gray-500">Sujet : {t.subject}</p>}
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedTemplate && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-blue-600 hover:underline mb-3 block"
                  >
                    {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
                  </button>
                  {showPreview && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                      <p className="text-xs text-gray-400 mb-2">Aperçu avec client exemple (Marie Dupont) :</p>
                      {selectedTemplate.subject && (
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Sujet : {preview(selectedTemplate.body, selectedTemplate.subject).subject}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {preview(selectedTemplate.body).body}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setStep(2)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Étape 2 — Destinataires */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-700">
                  Choisis les destinataires
                  <span className="ml-2 text-gray-400 font-normal">
                    — {selectedTemplate?.type === 'email' ? 'clients avec consentement email' : 'clients avec consentement SMS'}
                  </span>
                </h2>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selectedIds.size === eligibleClients.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {loadingClients ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : eligibleClients.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun client éligible. Vérifie les consentements.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === eligibleClients.length && eligibleClients.length > 0}
                            onChange={toggleAll}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Téléphone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {eligibleClients.map(client => (
                        <tr
                          key={client.id}
                          onClick={() => toggleClient(client.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedIds.has(client.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(client.id)}
                              onChange={() => toggleClient(client.id)}
                              onClick={e => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {client.prenom} {client.nom}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{client.email}</td>
                          <td className="px-4 py-3 text-gray-600">{client.telephone ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={selectedIds.size === 0 || sendMutation.isPending}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sendMutation.isPending
                    ? 'Envoi en cours...'
                    : `Envoyer à ${selectedIds.size} destinataire${selectedIds.size > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Résultat */}
          {step === 3 && result && (
            <div>
              <div className={`rounded-lg p-6 border mb-6 ${
                result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h2 className="font-semibold text-gray-900 mb-4">
                  Campagne "{result.template}" envoyée
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">{result.sent}</p>
                    <p className="text-xs text-gray-500 mt-1">Envoyé{result.sent > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-yellow-600">{result.skipped}</p>
                    <p className="text-xs text-gray-500 mt-1">Ignoré{result.skipped > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-red-600">{result.failed}</p>
                    <p className="text-xs text-gray-500 mt-1">Échoué{result.failed > 1 ? 's' : ''}</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="border-t border-yellow-200 pt-3">
                    <p className="text-xs font-medium text-red-600 mb-1">Erreurs :</p>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-500">{e}</p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Nouvelle campagne
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
