interface EsgFactor {
  category: 'E' | 'S' | 'G';
  name: string;
  score: number;
  weight: number;
  source: string;
  description: string;
}

interface EsgScore {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  factors: EsgFactor[];
  pricingAdjustment: number;
  grade: string;
}

interface EsgScoreCardProps {
  score: EsgScore;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-amber-100 text-amber-800 border-amber-300',
  D: 'bg-orange-100 text-orange-800 border-orange-300',
  E: 'bg-red-100 text-red-800 border-red-300',
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  E: { label: 'Environmental', icon: '🌱', color: 'text-green-600' },
  S: { label: 'Social', icon: '🤝', color: 'text-blue-600' },
  G: { label: 'Governance', icon: '🏛️', color: 'text-purple-600' },
};

export function EsgScoreCard({ score }: EsgScoreCardProps) {
  return (
    <div className="bg-card rounded-lg border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">ESG Sustainability Score</h3>
        <div className={`px-3 py-1 rounded-full border font-bold text-lg ${
          GRADE_COLORS[score.grade] || ''
        }`}>
          {score.grade}
        </div>
      </div>

      {/* Overall score gauge */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={score.overall >= 60 ? '#22c55e' : score.overall >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${score.overall}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{score.overall}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {(['E', 'S', 'G'] as const).map((cat) => {
            const info = CATEGORY_LABELS[cat];
            const value = cat === 'E' ? score.environmental : cat === 'S' ? score.social : score.governance;
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-sm">{info.icon}</span>
                <span className="text-xs w-24">{info.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      value >= 60 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing impact */}
      <div className={`p-3 rounded-lg ${
        score.pricingAdjustment < 0 ? 'bg-green-50' : score.pricingAdjustment > 0 ? 'bg-amber-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Pricing Adjustment</span>
          <span className={`text-sm font-bold ${
            score.pricingAdjustment < 0 ? 'text-green-700' : score.pricingAdjustment > 0 ? 'text-amber-700' : 'text-gray-600'
          }`}>
            {score.pricingAdjustment > 0 ? '+' : ''}{score.pricingAdjustment} bps
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {score.pricingAdjustment < 0
            ? 'Green discount applied to interest rate'
            : score.pricingAdjustment > 0
              ? 'ESG risk premium applied'
              : 'No pricing adjustment'}
        </p>
      </div>

      {/* Factor details */}
      <details className="group">
        <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
          View {score.factors.length} scoring factors ▸
        </summary>
        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
          {score.factors.map((factor, i) => (
            <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50">
              <span>{CATEGORY_LABELS[factor.category]?.icon}</span>
              <span className="flex-1">{factor.name}</span>
              <span className="text-muted-foreground">{factor.source}</span>
              <span className={`font-medium ${
                factor.score >= 60 ? 'text-green-600' : factor.score >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {factor.score}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
