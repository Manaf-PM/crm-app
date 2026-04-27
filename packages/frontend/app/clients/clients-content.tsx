'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi, api, type Client, type ClientCreate } from '../../lib/api'

const emptyForm: ClientCreate = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  consentementEmail: false,
  consentementSms: false,
}

interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
}

export default function ClientsContent() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientCreate>(emptyForm)
  const [search, setSearch] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); closeForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientCreate }) => clientsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); closeForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      prenom: client.prenom,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone ?? '',
      dateNaissance: client.dateNaissance ?? '',
      consentementEmail: client.consentementEmail,
      consentementSms: client.consentementSms,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      telephone: form.telephone || undefined,
      dateNaissance: form.dateNaissance || undefined,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<ImportResult>('/api/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(res.data)
      qc.invalidateQueries({ queryKey: ['clients'] })
    } catch {
      setImportResult({ imported: 0, errors: [{ row: 0, message: "Erreur lors de l'import" }] })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {importing ? 'Import...' : 'Importer CSV'}
          </button>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nouveau client
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${importResult.errors.length === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
          <span className="font-medium">{importResult.imported} client{importResult.imported !== 1 ? 's' : ''} importé{importResult.imported !== 1 ? 's' : ''}.</span>
          {importResult.errors.length > 0 && <span className="ml-2">{importResult.errors.length} erreur(s) — {importResult.errors[0]?.message}</span>}
          <button onClick={() => setImportResult(null)} className="ml-3 underline text-xs">Fermer</button>
        </div>
      )}

      <input
        type="text"
        placeholder="Rechercher par nom, prénom ou email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isLoading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun client trouvé.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Anniversaire</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Consentements</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.prenom} {client.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{client.email}</td>
                  <td className="px-4 py-3 text-gray-600">{client.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{client.dateNaissance ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {client.consentementEmail && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Email</span>}
                      {client.consentementSms && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">SMS</span>}
                      {!client.consentementEmail && !client.consentementSms && <span className="text-gray-400 text-xs">Aucun</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(client)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Modifier</button>
                      <button onClick={() => { if (confirm('Supprimer ce client ?')) deleteMutation.mutate(client.id) }} className="text-red-500 hover:text-red-700 text-xs font-medium">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Modifier le client' : 'Nouveau client'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                  <input required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                  <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.consentementEmail} onChange={e => setForm(f => ({ ...f, consentementEmail: e.target.checked }))} className="rounded" />
                  Consentement email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.consentementSms} onChange={e => setForm(f => ({ ...f, consentementSms: e.target.checked }))} className="rounded" />
                  Consentement SMS
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {isPending ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                </button>
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
