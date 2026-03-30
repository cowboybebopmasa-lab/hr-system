import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "key_rotation_logs";
const ROTATION_INTERVAL_DAYS = 90; // 90日ごとのローテーション推奨

export interface KeyRotationLog {
  id?: string;
  keyType: "service_account" | "encryption_key";
  rotatedAt: string;
  rotatedBy: string;
  nextRotationDue: string;
  status: "active" | "pending_rotation" | "rotated" | "expired";
  notes: string;
}

/**
 * キーローテーション状態を確認し、期限切れのキーを検出する
 */
export async function checkKeyRotationStatus(): Promise<{
  serviceAccountKey: { status: string; daysSinceRotation: number; nextDue: string; overdue: boolean };
  encryptionKey: { status: string; daysSinceRotation: number; nextDue: string; overdue: boolean };
  alerts: string[];
}> {
  const alerts: string[] = [];

  const saStatus = await getKeyStatus("service_account");
  const ekStatus = await getKeyStatus("encryption_key");

  if (saStatus.overdue) {
    alerts.push(`サービスアカウントキーのローテーション期限が${Math.abs(saStatus.daysSinceRotation) - ROTATION_INTERVAL_DAYS}日超過しています。至急ローテーションしてください。`);
  } else if (saStatus.daysSinceRotation > ROTATION_INTERVAL_DAYS - 14) {
    alerts.push(`サービスアカウントキーのローテーション期限が${ROTATION_INTERVAL_DAYS - saStatus.daysSinceRotation}日後に迫っています。`);
  }

  if (ekStatus.overdue) {
    alerts.push(`暗号化キーのローテーション期限が超過しています。至急ローテーションしてください。`);
  } else if (ekStatus.daysSinceRotation > ROTATION_INTERVAL_DAYS - 14) {
    alerts.push(`暗号化キーのローテーション期限が${ROTATION_INTERVAL_DAYS - ekStatus.daysSinceRotation}日後に迫っています。`);
  }

  return {
    serviceAccountKey: saStatus,
    encryptionKey: ekStatus,
    alerts,
  };
}

async function getKeyStatus(keyType: string) {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .where("keyType", "==", keyType)
    .where("status", "==", "active")
    .orderBy("rotatedAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return {
      status: "未登録",
      daysSinceRotation: 999,
      nextDue: "未設定",
      overdue: true,
    };
  }

  const doc = snapshot.docs[0].data() as KeyRotationLog;
  const rotatedAt = new Date(doc.rotatedAt);
  const now = new Date();
  const daysSinceRotation = Math.floor((now.getTime() - rotatedAt.getTime()) / (1000 * 60 * 60 * 24));
  const overdue = daysSinceRotation > ROTATION_INTERVAL_DAYS;

  return {
    status: overdue ? "要ローテーション" : "有効",
    daysSinceRotation,
    nextDue: doc.nextRotationDue,
    overdue,
  };
}

/**
 * キーローテーション実行を記録する
 */
export async function recordKeyRotation(
  keyType: "service_account" | "encryption_key",
  rotatedBy: string,
  notes: string = ""
): Promise<string> {
  // 既存のactiveレコードをrotatedに更新
  const existing = await getAdminDb()
    .collection(COLLECTION)
    .where("keyType", "==", keyType)
    .where("status", "==", "active")
    .get();

  const batch = getAdminDb().batch();
  existing.docs.forEach((doc) => {
    batch.update(doc.ref, { status: "rotated" });
  });

  // 新しいactiveレコードを作成
  const now = new Date();
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + ROTATION_INTERVAL_DAYS);

  const newLog: Omit<KeyRotationLog, "id"> = {
    keyType,
    rotatedAt: now.toISOString(),
    rotatedBy,
    nextRotationDue: nextDue.toISOString().split("T")[0],
    status: "active",
    notes,
  };

  const docRef = getAdminDb().collection(COLLECTION).doc();
  batch.set(docRef, { ...newLog, createdAt: FieldValue.serverTimestamp() });

  await batch.commit();
  return docRef.id;
}

/**
 * ローテーション履歴を取得する
 */
export async function getRotationHistory(limit: number = 20): Promise<KeyRotationLog[]> {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .orderBy("rotatedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as KeyRotationLog[];
}
