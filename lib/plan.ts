import type { CategorizedRow, CsvRow, ImportedDataset, Priority, PriorityConfig } from './types';

const falseValues = ['faux', 'false', 'non', 'no', '0'];

const categories = [
  {
    categorie: 'Visibilité/Électrique',
    responsable: 'Jessy',
    keywords: ['visibilite', 'visibilité', 'electrique', 'électrique']
  },
  {
    categorie: 'Freins/Pneumatique/Camion',
    responsable: 'Sebastien',
    keywords: ['freins', 'frein', 'pneumatique', 'camion']
  },
  {
    categorie: 'Agricole/Hydraulique agricole',
    responsable: 'Simon',
    keywords: ['agricole', 'hydraulique agricole']
  },
  {
    categorie: 'Conformité/VAD/Loi 430',
    responsable: 'Jean-Philippe',
    keywords: ['conformite', 'conformité', 'vad', 'loi 430']
  },
  {
    categorie: 'Soudure/Structure',
    responsable: 'Maxime',
    keywords: ['soudure', 'structure']
  }
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function includesKeyword(text: string, keyword: string) {
  return normalize(text).includes(normalize(keyword));
}

function isReady(row: CsvRow, dataset: ImportedDataset) {
  const pieceRecue = row[dataset.mapping.pieceRecue] ?? '';
  const piecesInstallees = row[dataset.mapping.piecesInstallees] ?? '';

  const installedValue = normalize(piecesInstallees);
  const isFalse = falseValues.includes(installedValue);

  return pieceRecue.trim().length > 0 && isFalse;
}

function deducePriority(text: string, config: PriorityConfig): Priority {
  if (config.P1.some((keyword) => includesKeyword(text, keyword))) {
    return 'P1';
  }

  if (config.P2.some((keyword) => includesKeyword(text, keyword))) {
    return 'P2';
  }

  return 'P3';
}

export function buildReadyList(dataset: ImportedDataset, config: PriorityConfig): CategorizedRow[] {
  const readyRows = dataset.rows.filter((row) => isReady(row, dataset));

  const categorized = readyRows.map((row) => {
    const pieceRequise = row[dataset.mapping.pieceRequise] ?? '';
    const commentaires = row[dataset.mapping.commentaires] ?? '';
    const combined = `${pieceRequise} ${commentaires}`.trim();

    const matched = categories.find((category) =>
      category.keywords.some((keyword) => includesKeyword(combined, keyword))
    );

    const priorite = deducePriority(combined, config);

    return {
      row,
      categorie: matched?.categorie ?? 'Autres',
      responsable: matched?.responsable ?? 'À assigner',
      priorite,
      raisons: matched?.keywords.filter((keyword) => includesKeyword(combined, keyword)) ?? []
    } satisfies CategorizedRow;
  });

  const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 };

  return categorized.sort((a, b) => priorityOrder[a.priorite] - priorityOrder[b.priorite]);
}

export function buildPlanText(items: CategorizedRow[], dataset: ImportedDataset): string {
  if (items.length === 0) {
    return 'Aucune tâche PRÊT À FAIRE trouvée.';
  }

  const header = 'Plan PRÊT À FAIRE';

  const lines = items.map((item, index) => {
    const unite = item.row[dataset.mapping.unite] ?? 'N/A';
    const piece = item.row[dataset.mapping.pieceRequise] ?? 'N/A';
    return `${index + 1}. [${item.priorite}] Unité ${unite} - ${piece} | ${item.categorie} (${item.responsable})`;
  });

  return [header, ...lines].join('\n');
}
