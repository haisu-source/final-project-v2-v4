// Tiny moderation guard for user-submitted comments. Catches the obvious cases:
// slurs, link spam, ALL CAPS shouting, and repeated-character noise. Not meant
// to replace a real moderation queue — it's a first-pass filter so reviewers
// only see borderline content.

const BLOCKLIST = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "kike",
  "spic",
  "chink",
];

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

export function moderateComment(raw: string): ModerationResult {
  const text = raw.trim();
  if (!text) return { ok: false, reason: "Comment is empty." };

  const lower = text.toLowerCase();

  for (const word of BLOCKLIST) {
    const re = new RegExp(`\\b${word}[a-z]*\\b`, "i");
    if (re.test(lower)) {
      return {
        ok: false,
        reason: "That comment contains language we don't allow. Please rephrase.",
      };
    }
  }

  const urlMatches = text.match(/https?:\/\/\S+/gi) ?? [];
  if (urlMatches.length > 2) {
    return { ok: false, reason: "Too many links. Please post one at a time." };
  }
  if (urlMatches.length > 0) {
    const wordsOutsideLinks = text
      .replace(/https?:\/\/\S+/gi, "")
      .split(/\s+/)
      .filter(Boolean).length;
    if (wordsOutsideLinks < 4) {
      return {
        ok: false,
        reason: "Please add a sentence of context with the link.",
      };
    }
  }

  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 12) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.7) {
      return { ok: false, reason: "Please don't post in all caps." };
    }
  }

  if (/(.)\1{9,}/.test(text)) {
    return { ok: false, reason: "Please don't spam repeated characters." };
  }

  return { ok: true };
}
