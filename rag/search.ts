export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findBestMatch(queryEmbedding: number[], store: { text: string; embedding: number[] }[]): string {
  let bestScore = -Infinity;
  let bestText = "";
  for (const item of store) {
    const score = cosineSimilarity(queryEmbedding, item.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestText = item.text;
    }
  }
  return bestText;
}
