import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type WhereFilterOp,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic CRUD operations for Firestore collections

export async function getDocuments<T>(
  collectionName: string,
  constraints?: {
    field?: string;
    op?: WhereFilterOp;
    value?: unknown;
    orderField?: string;
    orderDirection?: "asc" | "desc";
    limitCount?: number;
  }
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const queryConstraints = [];

  if (constraints?.field && constraints?.op && constraints?.value !== undefined) {
    queryConstraints.push(where(constraints.field, constraints.op, constraints.value));
  }
  if (constraints?.orderField) {
    queryConstraints.push(orderBy(constraints.orderField, constraints.orderDirection || "desc"));
  }
  if (constraints?.limitCount) {
    queryConstraints.push(limit(constraints.limitCount));
  }

  const q = queryConstraints.length > 0
    ? query(collectionRef, ...queryConstraints)
    : query(collectionRef);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: Omit<T, "id">
): Promise<string> {
  const now = Timestamp.now().toDate().toISOString();
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}
