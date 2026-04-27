/**
 * Vérifie si une date de naissance correspond à aujourd'hui (jour + mois)
 */
export function isAnniversaireAujourdhui(dateNaissance: string): boolean {
  const today = new Date()
  const birth = new Date(dateNaissance)
  return (
    birth.getDate() === today.getDate() &&
    birth.getMonth() === today.getMonth()
  )
}

/**
 * Formate une date ISO en date lisible française
 * ex: "1990-04-20" → "20 avril 1990"
 */
export function formatDateFr(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Retourne la date du jour au format ISO YYYY-MM-DD
 */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0]!
}