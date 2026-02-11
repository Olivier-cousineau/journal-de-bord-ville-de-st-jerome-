# journal-de-bord-ville-de-st-jerome-

Application Next.js (PWA) pour:

- importer un CSV côté client;
- mapper les colonnes métier;
- filtrer automatiquement les tâches **PRÊT À FAIRE**;
- catégoriser/assigner par mots-clés;
- générer un plan trié par priorité avec copie dans le presse-papiers;
- tout conserver localement (IndexedDB), sans backend.

## Démarrage

```bash
npm install
npm run dev
```

## Règles PRÊT À FAIRE

Une ligne est considérée prête si:

- `PIÈCE REÇUE` n'est pas vide;
- `PIÈCES INSTALLÉES` vaut `FAUX` (insensible à la casse, accepte aussi `false/non/no/0`).
