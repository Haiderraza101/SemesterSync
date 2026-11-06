import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SHARE_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function randomBlock(length) {
  return Array.from({ length }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
}

export function generateShareCode() {
  return `${randomBlock(4)}-${randomBlock(4)}`;
}

export function normalizeShareCode(value = "") {
  return String(value).trim().toUpperCase();
}

export function isValidShareCode(value) {
  return SHARE_CODE_PATTERN.test(value);
}
