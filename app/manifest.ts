import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Journal de bord - Ville de St-Jérôme',
    short_name: 'Journal de bord',
    description: 'Import CSV et génération du plan PRÊT À FAIRE',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f7fb',
    theme_color: '#0f4ac9',
    icons: []
  };
}
