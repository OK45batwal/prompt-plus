/**
 * AutoCorrect & Typos Normalizer Engine
 *
 * Automatically detects and corrects developer, technical, copywriting,
 * and common English spelling mistakes prior to prompt IR compilation.
 */

export interface AutoCorrectResult {
  originalText: string;
  correctedText: string;
  correctionsCount: number;
  changes: Array<{ from: string; to: string }>;
}

// Dictionary of common typos across coding, writing, data analysis & general prompt intent
const TYPO_MAP: Record<string, string> = {
  // Action Verbs & Common Prompt Words
  imrpove: "improve",
  improev: "improve",
  improove: "improve",
  ehance: "enhance",
  enhace: "enhance",
  enhanc: "enhance",
  respons: "response",
  responsees: "responses",
  systemm: "system",
  systeam: "system",
  architectur: "architecture",
  architechture: "architecture",
  generat: "generate",
  genrate: "generate",
  analize: "analyze",
  analyz: "analyze",
  analys: "analysis",
  optimise: "optimize",
  optmize: "optimize",
  optimis: "optimize",
  explan: "explain",
  explenation: "explanation",
  descibe: "describe",
  summaris: "summarize",
  sumarize: "summarize",
  conver: "convert",

  // Code & Technical Terms
  scrpaer: "scraper",
  scaper: "scraper",
  functon: "function",
  funtion: "function",
  funciton: "function",
  compnent: "component",
  componet: "component",
  reac: "react",
  reactjs: "React.js",
  nextjs: "Next.js",
  typocrift: "typescript",
  typescrip: "typescript",
  javascrip: "javascript",
  pyton: "python",
  pyhton: "python",
  tailwid: "tailwind",
  dataabse: "database",
  databse: "database",
  postgress: "postgresql",
  sqll: "sql",
  endpoin: "endpoint",
  endpont: "endpoint",
  midleware: "middleware",
  middlewar: "middleware",
  authentiction: "authentication",
  authentcation: "authentication",
  autorization: "authorization",
  secutiy: "security",
  securty: "security",
  dependancy: "dependency",
  dependancies: "dependencies",
  framwork: "framework",
  framworke: "framework",
  reponsive: "responsive",
  responisve: "responsive",
  algoritm: "algorithm",
  algorithem: "algorithm",
  asyncronous: "asynchronous",
  sincronous: "synchronous",

  // Writing & Copywriting Terms
  copywritng: "copywriting",
  headlin: "headline",
  articel: "article",
  newsleter: "newsletter",
  sentenc: "sentence",
  paragragh: "paragraph",
  grammer: "grammar",
  persuasiv: "persuasive",
  marketng: "marketing",
  audienc: "audience",

  // General English
  thier: "their",
  recieve: "receive",
  recieve: "receive",
  seperate: "separate",
  neccessary: "necessary",
  unneccessary: "unnecessary",
  referance: "reference",
  occured: "occurred",
  succesful: "successful",
  definately: "definitely",
  truely: "truly",
  fullfill: "fulfill",
  untill: "until",
  witout: "without",
  withing: "within",
  beacuse: "because",
  becuase: "because",
};

/**
 * Normalizes input text by correcting known spelling errors and typos
 * while preserving casing and word boundaries.
 */
export function autocorrectText(text: string): AutoCorrectResult {
  if (!text || !text.trim()) {
    return { originalText: text || "", correctedText: text || "", correctionsCount: 0, changes: [] };
  }

  const changes: Array<{ from: string; to: string }> = [];
  let correctionsCount = 0;

  // Replace matching typos using word boundary regex
  const correctedText = text.replace(/\b[a-zA-Z]+\b/g, (match) => {
    const lower = match.toLowerCase();
    const replacement = TYPO_MAP[lower];

    if (replacement && replacement.toLowerCase() !== lower) {
      correctionsCount++;
      // Preserve uppercase or capitalized casing
      let casedReplacement = replacement;
      if (match === match.toUpperCase()) {
        casedReplacement = replacement.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        casedReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      changes.push({ from: match, to: casedReplacement });
      return casedReplacement;
    }

    return match;
  });

  return {
    originalText: text,
    correctedText,
    correctionsCount,
    changes,
  };
}
