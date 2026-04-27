'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

interface Template {
  id: string
  nom: string
  type: 'email' | 'sms'
  reason: 'anniversaire' | 'periodique' | 'manuel'
  subject?: string
  body: string
  createdAt: string
  updatedAt: string
}

type TemplateCreate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>

const emptyForm: TemplateCreate = {
  nom: '',
  type: 'email',
  reason: 'manuel',
  subject: '',
  body: '',
}

const VARIABLES = ['{{prenom}}', '{{nom}}', '{{email}}']

const reasonLabels: Record<string, string> = {
  anniversaire: 'Anniversaire',
  periodique: 'Périodique',
  manuel: 'Manuel',
}

const typeLabels: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
}

const templatesApi = {
  list: () => api.get<Template[]>('/api/templates').then(r => r.data),
  create: (data: TemplateCreate) => api.post<Template>('/api/templates', data).then(r => r.data),
  update: (id: string, data: Partial<TemplateCreate>) =>
    api.patch<Template>(`/api/templates/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/templates/${id}`).then(r => r.data),
}

function preview(body: string): string {
  return body
    .replace(/{{prenom}}/g, 'Marie')
    .replace(/{{nom}}/g, 'Dupont')
    .replace(/{{email}}/g, 'marie.dupont@exemple.fr')
}

export default function TemplatesContent() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState<TemplateCreate>(emptyForm)
  const [showPreview, setShowPreview] = useState(false)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  })

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); closeForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateCreate> }) =>
      templatesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); closeForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowPreview(false)
    setShowForm(true)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setForm({
      nom: t.nom,
      type: t.type,
      reason: t.reason,
      subject: t.subject ?? '',
      body: t.body,
    })
    setShowPreview(false)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
    setShowPreview(false)
  }

  function insertVariable(v: string) {
    setForm(f => ({ ...f, body: f.body + v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      subject: form.type === 'email' ? form.subject : undefined,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nouveau template
        </button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : templates.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-sm">Aucun template. Crée-en un pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{t.nom}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.type === 'email'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {typeLabels[t.type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {reasonLabels[t.reason]}
                    </span>
                  </div>
                  {t.subject && (
                    <p className="text-xs text-gray-500 mb-1">Sujet : {t.subject}</p>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-2">{t.body}</p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce template ?')) deleteMutation.mutate(t.id) }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editing ? 'Modifier le template' : 'Nouveau template'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    required
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex : Email anniversaire"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type + Raison */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value as 'email' | 'sms' }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Usage *</label>
                    <select
                      value={form.reason}
                      onChange={e => setForm(f => ({ ...f, reason: e.target.value as 'anniversaire' | 'periodique' | 'manuel' }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manuel">Manuel</option>
                      <option value="anniversaire">Anniversaire</option>
                      <option value="periodique">Périodique</option>
                    </select>
                  </div>
                </div>

                {/* Sujet (email uniquement) */}
                {form.type === 'email' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sujet *</label>
                    <input
                      required={form.type === 'email'}
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Ex : Joyeux anniversaire {{prenom}} !"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Variables */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Variables disponibles
                  </label>
                  <div className="flex gap-2">
                    {VARIABLES.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corps */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Corps du message *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {showPreview ? 'Éditer' : 'Prévisualiser'}
                    </button>
                  </div>
                  {showPreview ? (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[160px]">
                      <p className="text-xs text-gray-400 mb-2">Aperçu avec client exemple (Marie Dupont) :</p>
                      {form.type === 'email' ? (
                        <div
                          className="text-sm text-gray-700 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: preview(form.body) }}
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{preview(form.body)}</p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      required
                      rows={form.type === 'sms' ? 4 : 8}
                      value={form.body}
                      onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                      placeholder={
                        form.type === 'email'
                          ? 'Bonjour {{prenom}},\n\nNous vous souhaitons un joyeux anniversaire !\n\nCordialement'
                          : 'Bonjour {{prenom}}, joyeux anniversaire ! - Mon CRM'
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                    />
                  )}
                  {form.type === 'sms' && (
                    <p className="text-xs text-gray-400 mt-1">
                      {preview(form.body).length} / 160 caractères
                    </p>
                  )}
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
