export const appWeights = {
  demand: 15,
  trend: 10,
  problem: 10,
  gap: 15,
  monetization: 10,
  distribution: 10,
  solo_fit: 8,
  technical: 5,
  localization: 5,
  wedge: 7,
  competition: 5,
};
export const gameWeights = {
  audience: 12,
  trend: 12,
  hook: 12,
  differentiation: 10,
  retention: 12,
  monetization: 10,
  production: 10,
  content: 7,
  distribution: 10,
  platform: 5,
};
export const confidenceWeights = {
  quality: 25,
  diversity: 15,
  recency: 15,
  agreement: 20,
  coverage: 15,
  specificity: 10,
};

// Every normalized factor is favorable: larger values always improve the score.
// These semantic definitions travel with the prompt and persisted assessments.
export const scoringRubricVersion = "1.1";
export const factorRubrics: Record<
  string,
  { meaning: string; anchors: string[] }
> = Object.fromEntries(
  Object.entries({
    demand: "Demand strength backed by observed need",
    trend: "Measured recent momentum; absent historical comparison is unknown",
    problem: "Intensity and frequency of the user problem",
    gap: "Credible unmet needs in existing alternatives",
    monetization: "Attractive plausible economics and willingness to pay",
    distribution:
      "Feasibility of reaching an audience through credible channels",
    solo_fit: "Feasibility of maintenance by a solo developer",
    technical: "Technical feasibility and accessible dependencies",
    localization:
      "Evidence-backed language, cultural or local-market advantage",
    wedge: "Specific evidence-backed differentiated entry point",
    competition:
      "Competition attractiveness AFTER incumbent pressure; intense competition without a defensible wedge scores LOW, never high",
    audience: "Evidence-backed demand from the intended game audience",
    hook: "Strength of the core gameplay hook",
    differentiation: "Distinct gameplay value relative to alternatives",
    retention: "Evidence-backed potential for repeat play",
    production: "Production feasibility for a solo developer",
    content:
      "Content feasibility, INVERSE of ongoing content burden; high recurring burden scores LOW",
    platform: "Fit with accessible platform capabilities and policies",
  }).map(([key, meaning]) => [
    key,
    {
      meaning,
      anchors: [
        "0: strongly unfavorable",
        "50: uncertain or mixed; explain missing evidence",
        "100: strongly favorable with evidence",
      ],
    },
  ]),
);
