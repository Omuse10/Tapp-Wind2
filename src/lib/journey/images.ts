import lions from "@/assets/memory-lions.jpg";
import elephants from "@/assets/memory-elephants.jpg";
import balloon from "@/assets/memory-balloon.jpg";
import hero from "@/assets/hero-savanna.jpg";
import guidePhoto from "@/assets/guide.jpg";

export const assetImages: Record<string, string> = {
  lions,
  elephants,
  balloon,
  hero,
  guide: guidePhoto,
};

export function resolveImage(key: string) {
  if (!key) return "";
  if (key.startsWith("data:") || key.startsWith("http") || key.startsWith("/")) return key;
  return assetImages[key] ?? "";
}

export { hero as heroImage, guidePhoto as guideImage };

/** Shrink a picked photo so it fits comfortably in on-device storage. */
export async function compressImage(file: File, maxSize = 1200): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return dataUrl;
  }
}