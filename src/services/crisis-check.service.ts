const PATTERNS: Record<string, RegExp[]> = {
  en: [
    /\b(kill myself|suicide|end my life|want to die|no reason to live)\b/i,
    /\b(hurting myself|self[\s-]?harm|cutting myself)\b/i,
    /\b(being abused|someone is hurting me|not safe at home)\b/i
  ]
};

export function checkForCrisis(text: string, language = "en") {
  const patterns = PATTERNS[language] ?? PATTERNS.en;
  const triggered = patterns.some((p) => p.test(text));
  return { triggered, matchedLanguage: triggered ? language : undefined };
}

export function crisisPayload(language = "en") {
  return {
    type: "CRISIS_RESOURCES",
    language,
    message: "It sounds like you may be going through something serious. Please contact a trusted person or appropriate emergency/crisis support in your area now. Bible AI is not a replacement for immediate human help."
  };
}
