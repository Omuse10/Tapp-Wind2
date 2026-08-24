import { supabase } from "@/integrations/supabase/client";
import { loadAnyVisitor, type VisitorSession } from "@/lib/journey/visitor";

export const MEMORY_BUCKET = "tourist-memories";

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && /^[a-z0-9]{1,5}$/i.test(fromName)) return fromName.toLowerCase();
  const fromType = file.type.split("/").pop();
  return fromType && /^[a-z0-9]{1,5}$/i.test(fromType) ? fromType.toLowerCase() : "jpg";
}

/** Uploads the real File to Storage, then records the row through create_memory. */
export async function uploadMemory(
  file: File,
  caption: string,
  visitorArg?: VisitorSession | null,
): Promise<{ objectPath: string; imagePath: string; publicUrl: string }> {
  const visitor = visitorArg ?? loadAnyVisitor();
  if (!visitor?.id || !visitor?.journeyId) {
    throw new Error("No visitor session — please open your journey link and enter your name first.");
  }

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const objectPath = `${visitor.id}/${unique}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(MEMORY_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) {
    console.error("[memory upload] storage failed", uploadError);
    throw new Error(`Photo upload failed: ${uploadError.message}`);
  }

  const imagePath = `${MEMORY_BUCKET}/${objectPath}`;
  const { data, error } = await supabase.rpc("create_memory", {
    p_journey_id: visitor.journeyId,
    p_visitor_id: visitor.id,
    p_image_path: imagePath,
    p_caption: caption.trim() || null,
  });
  if (error) {
    console.error("[memory upload] create_memory failed", error);
    throw new Error(`Saving your memory failed: ${error.message}`);
  }
  const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | undefined;
  if (!row?.id) throw new Error("create_memory returned no memory row.");

  const { data: pub } = supabase.storage.from(MEMORY_BUCKET).getPublicUrl(objectPath);
  return { objectPath, imagePath, publicUrl: pub.publicUrl };
}
