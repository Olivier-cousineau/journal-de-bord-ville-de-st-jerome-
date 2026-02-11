'use client';

import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import { buildPlanText, buildReadyList } from '@/lib/plan';
import {
  getDefaultPriorityConfig,
  loadDataset,
  loadMapping,
  loadPriorityConfig,
  saveDataset,
  saveMapping,
  savePriorityConfig
} from '@/lib/storage';
import type { ColumnMapping, CsvRow, ImportedDataset, Priority, PriorityConfig } from '@/lib/types';

const emptyMapping: ColumnMapping = {
  unite: '',
  pieceRequise: '',
  pieceRecue: '',
  piecesInstallees: '',
  commentaires: ''
};

function detectInitialMapping(headers: string[], previous: ColumnMapping | null): ColumnMapping {
  if (previous) {
    return {
      unite: headers.includes(previous.unite) ? previous.unite : '',
      pieceRequise: headers.includes(previous.pieceRequise) ? previous.pieceRequise : '',
      pieceRecue: headers.includes(previous.pieceRecue) ? previous.pieceRecue : '',
      piecesInstallees: headers.includes(previous.piecesInstallees) ? previous.piecesInstallees : '',
      commentaires: headers.includes(previous.commentaires) ? previous.commentaires : ''
    };
  }

  const find = (keywords: string[]) =>
    headers.find((header) => keywords.some((keyword) => header.toLowerCase().includes(keyword))) ?? '';

  return {
    unite: find(['unité', 'unite']),
    pieceRequise: find(['pièce requise', 'piece requise']),
    pieceRecue: find(['pièce reçue', 'piece recue', 'réception', 'reception']),
    piecesInstallees: find(['pièces installées', 'pieces installees', 'install']),
    commentaires: find(['comment'])
  };
}

export function CsvPlanner() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping);
  const [dataset, setDataset] = useState<ImportedDataset | null>(null);
  const [priorityConfig, setPriorityConfig] = useState<PriorityConfig>(getDefaultPriorityConfig());
  const [status, setStatus] = useState('Aucun fichier importé.');

  useEffect(() => {
    async function init() {
      const [savedDataset, savedConfig] = await Promise.all([loadDataset(), loadPriorityConfig()]);
      setPriorityConfig(savedConfig);

      if (savedDataset) {
        setDataset(savedDataset);
        setHeaders(savedDataset.headers);
        setRows(savedDataset.rows);
        setMapping(savedDataset.mapping);
        setStatus(`Dernier import chargé (${new Date(savedDataset.importedAt).toLocaleString('fr-CA')}).`);
      }
    }

    void init();
  }, []);

  const readyList = useMemo(() => {
    if (!dataset) {
      return [];
    }

    return buildReadyList(dataset, priorityConfig);
  }, [dataset, priorityConfig]);

  const planText = useMemo(() => {
    if (!dataset) {
      return 'Importez un CSV pour générer le plan.';
    }

    return buildPlanText(readyList, dataset);
  }, [dataset, readyList]);

  const canSaveMapping =
    mapping.unite &&
    mapping.pieceRequise &&
    mapping.pieceRecue &&
    mapping.piecesInstallees &&
    mapping.commentaires;

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const parsedHeaders = (result.meta.fields ?? []).filter(Boolean);
        const parsedRows = (result.data as CsvRow[]).filter((row) =>
          Object.values(row).some((value) => String(value ?? '').trim().length > 0)
        );

        const previousMapping = await loadMapping();
        const initialMapping = detectInitialMapping(parsedHeaders, previousMapping);

        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setMapping(initialMapping);
        setStatus(`${file.name} importé. Veuillez confirmer le mapping.`);
      },
      error: (error) => {
        setStatus(`Erreur d'import CSV: ${error.message}`);
      }
    });
  }

  async function saveCurrentMapping() {
    if (!canSaveMapping) {
      setStatus('Complétez le mapping des colonnes obligatoires.');
      return;
    }

    const nextDataset: ImportedDataset = {
      id: crypto.randomUUID(),
      importedAt: new Date().toISOString(),
      headers,
      rows,
      mapping
    };

    await Promise.all([saveMapping(mapping), saveDataset(nextDataset)]);
    setDataset(nextDataset);
    setStatus('Mapping et données sauvegardés localement (IndexedDB).');
  }

  async function updatePriority(priority: Priority, value: string) {
    const next = {
      ...priorityConfig,
      [priority]: value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    };

    setPriorityConfig(next);
    await savePriorityConfig(next);
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(planText);
    setStatus('Plan copié dans le presse-papiers.');
  }

  return (
    <div className="container">
      <h1>Import CSV & PRÊT À FAIRE</h1>
      <p className="status">{status}</p>

      <section className="card">
        <h2>1) Import CSV</h2>
        <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
        <p>Analyse côté client (PapaParse). Données stockées offline dans IndexedDB.</p>
      </section>

      {headers.length > 0 && (
        <section className="card">
          <h2>Mapping des colonnes</h2>
          <div className="mapping-grid">
            {(
              [
                ['unite', 'UNITÉ'],
                ['pieceRequise', 'PIÈCE REQUISE'],
                ['pieceRecue', 'PIÈCE REÇUE'],
                ['piecesInstallees', 'PIÈCES INSTALLÉES'],
                ['commentaires', 'COMMENTAIRES']
              ] as Array<[keyof ColumnMapping, string]>
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <select
                  value={mapping[field]}
                  onChange={(event) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field]: event.target.value
                    }))
                  }
                >
                  <option value="">-- Choisir une colonne --</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button onClick={saveCurrentMapping} disabled={!canSaveMapping}>
            Sauvegarder le mapping
          </button>
        </section>
      )}

      <section className="card">
        <h2>2) Filtre “PRÊT À FAIRE”</h2>
        <p>
          Critère: PIÈCE REÇUE non vide <strong>ET</strong> PIÈCES INSTALLÉES = “FAUX” (insensible à la
          casse).
        </p>
        <p>{readyList.length} tâche(s) prête(s) à faire.</p>
      </section>

      <section className="card">
        <h2>3) Priorités modifiables</h2>
        <p>Séparez les mots-clés par virgule pour ajuster P1/P2/P3.</p>
        {(['P1', 'P2', 'P3'] as Priority[]).map((priority) => (
          <label key={priority}>
            {priority}
            <input
              value={priorityConfig[priority].join(', ')}
              onChange={(event) => {
                void updatePriority(priority, event.target.value);
              }}
            />
          </label>
        ))}
      </section>

      <section className="card">
        <h2>4) Génération du plan</h2>
        <button onClick={copyPlan} disabled={!dataset}>
          Copier le plan
        </button>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Priorité</th>
                <th>Unité</th>
                <th>Pièce requise</th>
                <th>Catégorie</th>
                <th>Responsable</th>
                <th>Commentaires</th>
              </tr>
            </thead>
            <tbody>
              {readyList.map((item) => (
                <tr key={`${item.row[dataset?.mapping.unite ?? '']}-${item.row[dataset?.mapping.pieceRequise ?? '']}`}>
                  <td>{item.priorite}</td>
                  <td>{dataset ? item.row[dataset.mapping.unite] : ''}</td>
                  <td>{dataset ? item.row[dataset.mapping.pieceRequise] : ''}</td>
                  <td>{item.categorie}</td>
                  <td>{item.responsable}</td>
                  <td>{dataset ? item.row[dataset.mapping.commentaires] : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre>{planText}</pre>
      </section>
    </div>
  );
}
