import "server-only";
import { randomUUID } from "node:crypto";
import { LIMITS } from "@/lib/constants";
import { fail } from "./http";
import { db, EVIDENCE_BUCKET } from "./supabase";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** 이미지 1장 업로드(5MB 이하). 저장 경로 반환 */
export async function uploadImage(file: unknown, prefix: string): Promise<string> {
  if (!(file instanceof File)) fail(400, "이미지를 첨부해주세요.");
  const ext = EXT[file.type];
  if (!ext) fail(400, "이미지 파일만 올릴 수 있어요.");
  if (file.size > LIMITS.evidenceBytes) fail(400, "5MB 이하 이미지만 올릴 수 있어요.");
  const path = `${prefix}/${randomUUID()}.${ext}`;
  const { error } = await db()
    .storage.from(EVIDENCE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error("upload");
  return path;
}
