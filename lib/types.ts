export type CanonicalField =
  | 'unite'
  | 'pieceRequise'
  | 'pieceRecue'
  | 'piecesInstallees'
  | 'commentaires';

export type CsvRow = Record<string, string>;

export interface ColumnMapping {
  unite: string;
  pieceRequise: string;
  pieceRecue: string;
  piecesInstallees: string;
  commentaires: string;
}

export interface ImportedDataset {
  id: string;
  importedAt: string;
  headers: string[];
  rows: CsvRow[];
  mapping: ColumnMapping;
}

export type Priority = 'P1' | 'P2' | 'P3';

export interface CategorizedRow {
  row: CsvRow;
  categorie: string;
  responsable: string;
  priorite: Priority;
  raisons: string[];
}

export interface PriorityConfig {
  P1: string[];
  P2: string[];
  P3: string[];
}
