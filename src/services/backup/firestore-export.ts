import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTIONS = [
  "employees",
  "contracts",
  "attendance",
  "payroll",
  "job_postings",
  "evaluations",
  "key_rotation_logs",
];

export interface ExportResult {
  collectionName: string;
  documentCount: number;
  data: Record<string, unknown>[];
}

/**
 * Firestoreの全コレクションをJSON形式でエクスポートする
 */
export async function exportAllCollections(): Promise<{
  exportedAt: string;
  collections: ExportResult[];
  totalDocuments: number;
}> {
  const exportedAt = new Date().toISOString();
  const collections: ExportResult[] = [];
  let totalDocuments = 0;

  for (const collectionName of COLLECTIONS) {
    try {
      const snapshot = await getAdminDb().collection(collectionName).get();
      const data = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));
      collections.push({
        collectionName,
        documentCount: data.length,
        data,
      });
      totalDocuments += data.length;
    } catch (error) {
      console.warn(`Collection "${collectionName}" export skipped:`, error);
      collections.push({
        collectionName,
        documentCount: 0,
        data: [],
      });
    }
  }

  return { exportedAt, collections, totalDocuments };
}
