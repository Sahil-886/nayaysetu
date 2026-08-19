const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'data', 'corpus-index.json');
const raw = fs.readFileSync(indexPath, 'utf-8');
const parsed = JSON.parse(raw);

const judgments = parsed.judgments;
const corpusChunks = parsed.corpusChunks;

console.log('Judgments:', judgments.length);
console.log('Chunks:', corpusChunks.length);

function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeHybridMatchScore(targetMeta, corpusMeta, cosineSim) {
  const targetStatutes = targetMeta?.statutes_and_sections || [];
  const corpusStatutes = corpusMeta?.statutes_and_sections || [];

  const targetDomain = (targetMeta?.legal_domain || '').toLowerCase().trim();
  const corpusDomain = (corpusMeta?.legal_domain || '').toLowerCase().trim();

  const sharedStatutes = [];
  for (const ts of targetStatutes) {
    const cleanTs = ts.toLowerCase();
    for (const cs of corpusStatutes) {
      const cleanCs = cs.toLowerCase();
      const tsNum = cleanTs.match(/(section\s*\d+|article\s*\d+|\d+)/i)?.[0];
      const csNum = cleanCs.match(/(section\s*\d+|article\s*\d+|\d+)/i)?.[0];
      const tsCleanBase = cleanTs.replace(/\d{4}/g, '').trim();
      const csCleanBase = cleanCs.replace(/\d{4}/g, '').trim();

      if (
        cleanTs === cleanCs ||
        tsCleanBase === csCleanBase ||
        (tsNum && csNum && tsNum === csNum && (cleanTs.includes(csCleanBase) || cleanCs.includes(tsCleanBase)))
      ) {
        if (!sharedStatutes.includes(cs)) {
          sharedStatutes.push(cs);
        }
      }
    }
  }

  let statuteScore = 0;
  if (sharedStatutes.length > 0) {
    statuteScore = Math.min(50, 35 + (sharedStatutes.length - 1) * 15);
  }

  let domainMatch = false;
  let domainScore = 0;
  if (targetDomain && corpusDomain) {
    const tDomParts = targetDomain.split('/');
    const cDomParts = corpusDomain.split('/');
    const hasPartMatch = tDomParts.some((tp) => cDomParts.some((cp) => tp.trim() === cp.trim()));
    if (
      targetDomain === corpusDomain ||
      targetDomain.includes(corpusDomain) ||
      corpusDomain.includes(targetDomain) ||
      hasPartMatch
    ) {
      domainMatch = true;
      domainScore = 25;
    }
  }

  const embedScore = Math.round(Math.max(0, Math.min(1, cosineSim)) * 10);
  const hybridScore = Math.min(100, Math.round(statuteScore + domainScore + embedScore));

  return { hybridScore, statuteScore, domainScore, sharedStatutes, domainMatch };
}

const targetMeta = {
  statutes_and_sections: ['Section 24 Hindu Marriage Act', 'Hindu Marriage Act 1955'],
  legal_domain: 'Matrimonial/Maintenance',
  key_legal_issues: ['Assessment of husband income', 'Determination of interim maintenance']
};

const queryEmb = new Array(768).fill(0.01);
const caseScores = new Map();

for (const chunk of corpusChunks) {
  let judgment = judgments.find((j) => j.id === chunk.judgment_id);
  if (!judgment && chunk.source_file) {
    judgment = judgments.find((j) => j.source_file === chunk.source_file);
  }
  if (!judgment) continue;

  const sim = cosineSimilarity(queryEmb, chunk.embedding);
  const existing = caseScores.get(judgment.id);
  if (!existing || sim > existing.maxSim) {
    caseScores.set(judgment.id, { maxSim: sim, sampleContent: chunk.content, judgment });
  }
}

console.log('caseScores size:', caseScores.size);
const results = Array.from(caseScores.values()).map((item) => {
  const hybrid = computeHybridMatchScore(targetMeta, item.judgment.legal_metadata, item.maxSim);
  return {
    case_name: item.judgment.case_name,
    hybridScore: hybrid.hybridScore,
    shared_statutes: hybrid.sharedStatutes,
    domain_match: hybrid.domainMatch,
  };
});

results.sort((a, b) => b.hybridScore - a.hybridScore);
console.log('Results:', JSON.stringify(results, null, 2));
