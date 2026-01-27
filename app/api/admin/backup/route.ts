import fs from "fs";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
const uploadsPath = process.env.UPLOADS_PATH || "./data/uploads";

const resolvePath = (value: string) => path.resolve(value);

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const toBackupName = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `rohde-audio-backup-${now.getUTCFullYear()}-${pad(
    now.getUTCMonth() + 1
  )}-${pad(now.getUTCDate())}.zip`;
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zip = new AdmZip();
  const resolvedDb = resolvePath(dbPath);
  if (fs.existsSync(resolvedDb)) {
    zip.addLocalFile(resolvedDb, "data");
  }
  const resolvedUploads = resolvePath(uploadsPath);
  if (fs.existsSync(resolvedUploads)) {
    zip.addLocalFolder(resolvedUploads, "uploads");
  }

  const settingsRows = db
    .prepare("SELECT key, value FROM settings")
    .all() as Array<{ key: string; value: string }>;
  const settings = settingsRows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  const meta = {
    createdAt: new Date().toISOString(),
    includes: {
      db: fs.existsSync(resolvedDb),
      uploads: fs.existsSync(resolvedUploads),
      settings: true,
    },
  };
  zip.addFile("settings.json", Buffer.from(JSON.stringify(settings, null, 2)));
  zip.addFile("backup-meta.json", Buffer.from(JSON.stringify(meta, null, 2)));

  const buffer = zip.toBuffer();
  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${toBackupName()}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

export async function POST(request: Request) {
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Bitte ZIP-Datei auswählen." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rohde-backup-"));
  zip.extractAllTo(tempDir, true);

  const resolvedDb = resolvePath(dbPath);
  ensureDir(path.dirname(resolvedDb));
  const dbEntry = entries.find((entry) => entry.entryName.endsWith("app.db"));
  if (dbEntry) {
    const source = path.join(tempDir, dbEntry.entryName);
    if (fs.existsSync(source)) {
      const backupPath = `${resolvedDb}.bak`;
      if (fs.existsSync(resolvedDb)) {
        fs.renameSync(resolvedDb, backupPath);
      }
      fs.renameSync(source, resolvedDb);
    }
  }

  const resolvedUploads = resolvePath(uploadsPath);
  const uploadsEntry = entries.find((entry) => entry.entryName.startsWith("uploads/"));
  if (uploadsEntry) {
    const extractedUploads = path.join(tempDir, "uploads");
    if (fs.existsSync(extractedUploads)) {
      const backupUploads = `${resolvedUploads}.bak`;
      if (fs.existsSync(resolvedUploads)) {
        fs.renameSync(resolvedUploads, backupUploads);
      }
      fs.renameSync(extractedUploads, resolvedUploads);
    }
  }

  return NextResponse.json({
    success: true,
    message:
      "Backup eingespielt. Bitte den Server/Container neu starten, damit die Datenbank sicher geladen wird.",
  });
}
