import { google } from "googleapis";
import { Readable } from "stream";
import { encryptData } from "./encryption";
import { exportAllCollections } from "./firestore-export";

function getGoogleAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");

  const credentials = JSON.parse(key);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

/**
 * Firestoreの全データをエクスポート→暗号化→Google Driveにアップロード
 */
export async function performBackup(): Promise<{
  success: boolean;
  folderId: string;
  fileId: string;
  fileName: string;
  totalDocuments: number;
  sizeBytes: number;
  exportedAt: string;
  error?: string;
}> {
  const parentFolderId = process.env.GDRIVE_BACKUP_FOLDER_ID;
  if (!parentFolderId) throw new Error("GDRIVE_BACKUP_FOLDER_ID not set");

  // Step 1: Firestoreエクスポート
  const exportData = await exportAllCollections();

  // Step 2: JSON化 → 暗号化
  const jsonString = JSON.stringify(exportData, null, 2);
  const encryptedBuffer = encryptData(jsonString);

  // Step 3: Google Drive にアップロード
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = now.toISOString().split("T")[1].replace(/[:.]/g, "-").slice(0, 8); // HH-MM-SS
  const fileName = `hr-backup-${dateStr}_${timeStr}.enc`;

  // 日付フォルダを作成（存在しなければ）
  const folderName = `backup-${dateStr}`;
  let dateFolderId: string;

  const folderSearch = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
  });

  if (folderSearch.data.files && folderSearch.data.files.length > 0) {
    dateFolderId = folderSearch.data.files[0].id!;
  } else {
    const folderRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id",
    });
    dateFolderId = folderRes.data.id!;
  }

  // ファイルアップロード
  const stream = new Readable();
  stream.push(encryptedBuffer);
  stream.push(null);

  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [dateFolderId],
      description: `HR System Backup - ${exportData.totalDocuments} documents - AES-256-GCM encrypted`,
    },
    media: {
      mimeType: "application/octet-stream",
      body: stream,
    },
    fields: "id,name,size",
  });

  return {
    success: true,
    folderId: dateFolderId,
    fileId: uploadRes.data.id!,
    fileName: uploadRes.data.name!,
    totalDocuments: exportData.totalDocuments,
    sizeBytes: encryptedBuffer.length,
    exportedAt: exportData.exportedAt,
  };
}

/**
 * 古いバックアップフォルダを削除（世代管理: デフォルト30日保持）
 */
export async function cleanupOldBackups(retentionDays: number = 30): Promise<number> {
  const parentFolderId = process.env.GDRIVE_BACKUP_FOLDER_ID;
  if (!parentFolderId) return 0;

  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const folders = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and name contains 'backup-'`,
    fields: "files(id,name,createdTime)",
  });

  let deletedCount = 0;
  for (const folder of folders.data.files || []) {
    const folderDate = folder.name?.replace("backup-", "");
    if (folderDate && new Date(folderDate) < cutoffDate) {
      await drive.files.delete({ fileId: folder.id! });
      deletedCount++;
    }
  }

  return deletedCount;
}
