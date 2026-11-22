export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateAvatar(file) {
  if (!file) return "";
  if (!AVATAR_TYPES.includes(file.type)) return "Choose a PNG, JPG or WebP image.";
  if (file.size > AVATAR_MAX_BYTES) return "The picture must be 2 MB or smaller.";
  return "";
}
