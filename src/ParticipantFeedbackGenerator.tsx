import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Upload, Download, Users, Heart, Info, CheckCircle, Shuffle, Settings, FileText } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Competency {
  name: string;
  short: string;
  description: string;
  factor: 'Interpersonal' | 'Self-Management';
}

interface CompetencyMap {
  [key: string]: Competency;
}

interface Participant {
  id: number;
  name: string;
  team: string;
  conflict_resolution: number;
  collaborative_problem_solving: number;
  communication: number;
  goal_setting: number;
  planning_coordination: number;
  satisfaction: number;
  overallScore?: number;
  interpersonalScore?: number;
  selfManagementScore?: number;
  [key: string]: string | number | undefined;
}

interface TeamData {
  members: Participant[];
  competencyTotals: { [key: string]: number };
  count: number;
  averages: { [key: string]: number };
  interpersonalAvg: number;
  selfManagementAvg: number;
  teamMeanOverall: number;
  agreementPercentage: number;
  isHighAgreement: boolean;
}

interface TeamStats {
  [team: string]: TeamData;
}

interface ResearcherConfig {
  researcherName: string;
  researcherEmail: string;
  piName: string;
  piEmail: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const competencyDescriptions: CompetencyMap = {
  conflict_resolution: {
    name: "Conflict Resolution",
    short: "CR",
    description: "The ability to recognize different types and sources of conflict, encourage constructive disagreement while discouraging destructive conflict, and integrate diverse viewpoints during negotiation processes.",
    factor: "Interpersonal"
  },
  collaborative_problem_solving: {
    name: "Collaborative Problem Solving",
    short: "CPS",
    description: "Involves identifying when group approaches are needed, participating appropriately in collective problem solving activities, and recognizing obstacles to effective collaboration.",
    factor: "Interpersonal"
  },
  communication: {
    name: "Communication",
    short: "COM",
    description: "Includes listening actively, providing clear and timely information, and adapting communication style to different audiences and contexts.",
    factor: "Interpersonal"
  },
  goal_setting: {
    name: "Goal Setting and Performance Management",
    short: "GSPM",
    description: "Involves establishing specific and challenging team objectives, monitoring progress toward goals, and providing constructive feedback on team activities.",
    factor: "Self-Management"
  },
  planning_coordination: {
    name: "Planning and Task Coordination",
    short: "PTC",
    description: "Requires coordinating activities and information between team members, establishing appropriate role assignments, and managing workload distribution effectively.",
    factor: "Self-Management"
  }
};

const COMPETENCY_KEYS = [
  'conflict_resolution',
  'collaborative_problem_solving',
  'communication',
  'goal_setting',
  'planning_coordination',
] as const;

const INTERPERSONAL_KEYS = ['conflict_resolution', 'collaborative_problem_solving', 'communication'] as const;
const SELF_MGMT_KEYS = ['goal_setting', 'planning_coordination'] as const;

// ---------------------------------------------------------------------------
// Raw survey item → subscale mapping
// ---------------------------------------------------------------------------

const SUBSCALE_ITEMS: Record<string, string[]> = {
  conflict_resolution: ['CR1', 'CR7', 'CR10', 'CR15', 'CR16', 'CR18', 'CR19', 'CR21'],
  collaborative_problem_solving: ['CPS3', 'CPS11', 'CPS14', 'CPS24', 'CPS25', 'CPS26'],
  communication: ['COM2', 'COM5', 'COM8', 'COM9', 'COM12', 'COM17', 'COM27', 'COM28', 'COM29', 'COM30'],
  goal_setting: ['GSPM6', 'GSPM20', 'GSPM22', 'GSPM31', 'GSPM32', 'GSPM35', 'GSPM36'],
  planning_coordination: ['PTC4', 'PTC13', 'PTC23', 'PTC33', 'PTC34'],
  satisfaction: ['Satisfaction_1', 'Satisfaction_2', 'Satisfaction_3', 'Satisfaction_4', 'Satisfaction_5'],
};

/** Items that require reverse scoring (5 - raw) */
const REVERSE_SCORED_ITEMS = new Set(['CPS11', 'CPS25', 'CPS26', 'Satisfaction_3']);

/** Map text responses to numeric scores (case-insensitive, trimmed) */
function textToScore(text: string): number | null {
  const t = text.trim().toLowerCase();
  switch (t) {
    case 'completely disagree':
    case 'strongly disagree':
      return 1;
    case 'disagree':
      return 2;
    case 'agree':
      return 3;
    case 'completely agree':
    case 'strongly agree':
      return 4;
    default:
      return null;
  }
}

const DISCLAIMER_TEXT =
  'This profile is provided as part of a research study conducted through the University of Nevada, Las Vegas. The information presented reflects your individual responses and your team\u2019s aggregated data from the Teamwork Competency Test and post-session satisfaction survey. Scores represent self-reported behavioral tendencies and are not evaluative assessments of job performance or professional capability.';

/**
 * Sample data using obviously fictitious names so profiles can be shared
 * with prospective teams without risk of confusion with real participants.
 */
const SAMPLE_DATA: Participant[] = [
  // Sample Team A — high agreement team (scores clustered tightly)
  { id: 0,  name: "John Q. Sample",       team: "Sample Team A", conflict_resolution: 3.4, collaborative_problem_solving: 3.1, communication: 3.6, goal_setting: 2.9, planning_coordination: 3.2, satisfaction: 4.2 },
  { id: 1,  name: "Jane A. Placeholder",  team: "Sample Team A", conflict_resolution: 3.2, collaborative_problem_solving: 3.3, communication: 3.1, goal_setting: 3.0, planning_coordination: 3.1, satisfaction: 4.5 },
  { id: 2,  name: "Fakename McNotreal",   team: "Sample Team A", conflict_resolution: 3.0, collaborative_problem_solving: 2.9, communication: 3.4, goal_setting: 3.2, planning_coordination: 2.8, satisfaction: 3.8 },
  { id: 3,  name: "Demo P. Participant",   team: "Sample Team A", conflict_resolution: 3.3, collaborative_problem_solving: 3.2, communication: 3.2, goal_setting: 3.1, planning_coordination: 3.0, satisfaction: 4.0 },
  // Sample Team B — diverse competency team (scores spread widely)
  { id: 4,  name: "Testy McTestface",     team: "Sample Team B", conflict_resolution: 2.4, collaborative_problem_solving: 3.5, communication: 2.8, goal_setting: 3.6, planning_coordination: 3.4, satisfaction: 3.5 },
  { id: 5,  name: "Nora T. Real",         team: "Sample Team B", conflict_resolution: 3.8, collaborative_problem_solving: 2.6, communication: 3.2, goal_setting: 2.4, planning_coordination: 2.9, satisfaction: 3.8 },
  { id: 6,  name: "Definitely Notaperson", team: "Sample Team B", conflict_resolution: 2.9, collaborative_problem_solving: 3.1, communication: 2.5, goal_setting: 3.0, planning_coordination: 3.7, satisfaction: 3.2 },
  { id: 7,  name: "Example B. Data",      team: "Sample Team B", conflict_resolution: 3.1, collaborative_problem_solving: 2.8, communication: 3.6, goal_setting: 2.7, planning_coordination: 2.6, satisfaction: 2.8 },
  // Sample Team C — mixed spread
  { id: 8,  name: "Placeholder Person",   team: "Sample Team C", conflict_resolution: 3.9, collaborative_problem_solving: 3.7, communication: 3.8, goal_setting: 3.6, planning_coordination: 3.5, satisfaction: 3.5 },
  { id: 9,  name: "Anon Y. Mous",         team: "Sample Team C", conflict_resolution: 2.1, collaborative_problem_solving: 2.3, communication: 2.0, goal_setting: 2.2, planning_coordination: 2.4, satisfaction: 2.2 },
  { id: 10, name: "Ima G. Nary",          team: "Sample Team C", conflict_resolution: 3.2, collaborative_problem_solving: 2.8, communication: 3.0, goal_setting: 2.9, planning_coordination: 3.1, satisfaction: 2.8 },
  { id: 11, name: "Fakey S. Fakerson",    team: "Sample Team C", conflict_resolution: 1.8, collaborative_problem_solving: 2.0, communication: 2.2, goal_setting: 1.9, planning_coordination: 2.1, satisfaction: 1.9 },
];

const DEFAULT_CONFIG: ResearcherConfig = {
  researcherName: '',
  researcherEmail: '',
  piName: '',
  piEmail: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcInterpersonal(p: Participant): number {
  return (
    (p.conflict_resolution || 0) +
    (p.collaborative_problem_solving || 0) +
    (p.communication || 0)
  ) / 3;
}

function calcSelfManagement(p: Participant): number {
  return ((p.goal_setting || 0) + (p.planning_coordination || 0)) / 2;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ParticipantFeedbackGenerator = () => {
  const [data, setData] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats>({});
  const [config, setConfig] = useState<ResearcherConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [batchPrintMode, setBatchPrintMode] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [satisfactionMax, setSatisfactionMax] = useState(5);
  const batchPrintRef = useRef(false);

  // Trigger print once batch cards are rendered
  useEffect(() => {
    if (batchPrintMode && !batchPrintRef.current) {
      batchPrintRef.current = true;
      // Allow a frame for the cards (especially Recharts SVGs) to render
      const timer = setTimeout(() => {
        window.print();
        setBatchPrintMode(false);
        batchPrintRef.current = false;
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [batchPrintMode]);

  const printCard = () => {
    window.print();
  };

  const handleBatchPrint = () => {
    setSelectedParticipant(null);
    setBatchPrintMode(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  /**
   * Convert a raw-item CSV row into a Participant by scoring text responses,
   * applying reverse scoring, and averaging items into subscales.
   */
  const convertRawRow = (
    headers: string[],
    values: string[],
    idx: number,
  ): Participant => {
    // Build a map of header → raw value
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = (values[i] ?? '').trim(); });

    // Score every survey item
    const scored: Record<string, number> = {};
    for (const items of Object.values(SUBSCALE_ITEMS)) {
      for (const item of items) {
        const val = raw[item];
        if (val === undefined || val === '') continue;
        let score = textToScore(val);
        if (score === null) {
          // Try parsing as a number (in case some responses are already numeric)
          const n = parseFloat(val);
          score = isNaN(n) ? null : n;
        }
        if (score !== null) {
          scored[item] = REVERSE_SCORED_ITEMS.has(item) ? 5 - score : score;
        }
      }
    }

    // Average items within each subscale
    const subscales: Record<string, number> = {};
    for (const [subscale, items] of Object.entries(SUBSCALE_ITEMS)) {
      const scores = items.map(i => scored[i]).filter((v): v is number => v !== undefined);
      subscales[subscale] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }

    return {
      id: idx,
      name: raw['Email_1'] || `Participant ${idx + 1}`,
      team: raw['Team'] || 'Unassigned',
      conflict_resolution: subscales.conflict_resolution,
      collaborative_problem_solving: subscales.collaborative_problem_solving,
      communication: subscales.communication,
      goal_setting: subscales.goal_setting,
      planning_coordination: subscales.planning_coordination,
      satisfaction: subscales.satisfaction,
    };
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const isRawFormat = rawHeaders.some(h => h === 'Email_1');

    if (isRawFormat) {
      const parsedData: Participant[] = lines.slice(1)
        .filter(line => line.trim())
        .map((line, idx) => convertRawRow(rawHeaders, line.split(','), idx));

      setSatisfactionMax(4);
      setData(parsedData);
      calculateTeamStats(parsedData);
    } else {
      // Legacy format: pre-computed means
      const headers = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      const parsedData: Participant[] = lines.slice(1)
        .filter(line => line.trim())
        .map((line, idx) => {
          const values = line.split(',').map(v => v.trim());
          const obj: Record<string, string | number> = { id: idx };
          headers.forEach((header, index) => {
            obj[header] = isNaN(Number(values[index])) ? values[index] : parseFloat(values[index]);
          });
          return obj as unknown as Participant;
        });

      setSatisfactionMax(5);
      setData(parsedData);
      calculateTeamStats(parsedData);
    }
  };

  const calculateTeamStats = (participants: Participant[]) => {
    const teams: TeamStats = {};

    participants.forEach(p => {
      const team = p.team || 'Unassigned';
      if (!teams[team]) {
        teams[team] = {
          members: [],
          competencyTotals: {},
          count: 0,
          averages: {},
          interpersonalAvg: 0,
          selfManagementAvg: 0,
          teamMeanOverall: 0,
          agreementPercentage: 0,
          isHighAgreement: false,
        };
        COMPETENCY_KEYS.forEach(c => { teams[team].competencyTotals[c] = 0; });
      }
      teams[team].members.push(p);
      teams[team].count += 1;
      COMPETENCY_KEYS.forEach(c => {
        teams[team].competencyTotals[c] += (Number(p[c]) || 0);
      });
    });

    Object.keys(teams).forEach(team => {
      const t = teams[team];
      t.averages = {};
      COMPETENCY_KEYS.forEach(c => {
        t.averages[c] = t.competencyTotals[c] / t.count;
      });

      // Team-level factor composites from the dimension averages
      t.interpersonalAvg =
        INTERPERSONAL_KEYS.reduce((s, k) => s + t.averages[k], 0) / INTERPERSONAL_KEYS.length;
      t.selfManagementAvg =
        SELF_MGMT_KEYS.reduce((s, k) => s + t.averages[k], 0) / SELF_MGMT_KEYS.length;

      // Per-member factor scores & overall
      t.members.forEach(member => {
        member.interpersonalScore = calcInterpersonal(member);
        member.selfManagementScore = calcSelfManagement(member);
        member.overallScore = (member.interpersonalScore + member.selfManagementScore) / 2;
      });

      // Team mean overall
      const teamMeanOverall =
        t.members.reduce((sum, m) => sum + (m.overallScore ?? 0), 0) / t.count;
      t.teamMeanOverall = teamMeanOverall;

      // High agreement: 70%+ within +/-0.3 of team mean overall
      const membersInAgreement = t.members.filter(m =>
        Math.abs((m.overallScore ?? 0) - teamMeanOverall) <= 0.3
      ).length;
      t.agreementPercentage = (membersInAgreement / t.count) * 100;
      t.isHighAgreement = t.agreementPercentage >= 70;
    });

    setTeamStats(teams);
  };

  const loadSampleData = () => {
    setData(SAMPLE_DATA);
    calculateTeamStats(SAMPLE_DATA);
    setSatisfactionMax(5);
    setUsingSampleData(true);
  };

  const resetData = () => {
    setData([]);
    setSelectedParticipant(null);
    setTeamStats({});
    setBatchPrintMode(false);
    setUsingSampleData(false);
    setSatisfactionMax(5);
  };

  // -----------------------------------------------------------------------
  // Profile Card
  // -----------------------------------------------------------------------

  const ParticipantCard = ({ participant }: { participant: Participant }) => {
    const team = participant.team || 'Unassigned';
    const name = participant.name || 'Participant';
    const td = teamStats[team] || {
      averages: {},
      isHighAgreement: false,
      interpersonalAvg: 0,
      selfManagementAvg: 0,
    } as TeamData;
    const satisfaction = participant.satisfaction || 0;

    const interpersonal = participant.interpersonalScore ?? calcInterpersonal(participant);
    const selfMgmt = participant.selfManagementScore ?? calcSelfManagement(participant);

    const radarData = Object.keys(competencyDescriptions).map(key => ({
      competency: competencyDescriptions[key].short,
      fullName: competencyDescriptions[key].name,
      You: Number(participant[key]) || 0,
      'Team Average': td.averages[key] || 0,
    }));

    return (
      <div
        id={`card-${participant.id}`}
        className="bg-white max-w-3xl mx-auto mb-8 print-card"
      >
        {/* ============ PAGE 1 ============ */}

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-t-sm" />

        {/* Header */}
        <div className="text-center pt-8 pb-2 print-section">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-500 mb-3">
            Collaborative Problem Solving Study
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{name}</h1>
          <p className="text-sm text-gray-500">Thank you for your valuable contribution to our research!</p>
        </div>

        {/* Team Info Banner */}
        <div className="flex items-center justify-center gap-3 py-3 mt-4 print-section">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            td.isHighAgreement
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Users size={16} />
            <span>{team}</span>
            <span className="text-gray-300 mx-1">|</span>
            {td.isHighAgreement ? (
              <span className="flex items-center gap-1">
                <CheckCircle size={14} />
                High Agreement
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Shuffle size={14} />
                Diverse Competency
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-8 mt-4" />

        {/* Radar Chart */}
        <div className="px-8 pt-6 pb-2 print-section">
          <h2 className="text-lg font-bold text-gray-800 mb-1 text-center">Your Teamwork Competency Profile</h2>
          <p className="text-xs text-gray-400 text-center mb-2">Your responses compared to your team's average (Scale: 1–4)</p>
          <div className="print-chart-container" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 4]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Team Average"
                  dataKey="Team Average"
                  stroke="#94a3b8"
                  fill="#cbd5e1"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="You"
                  dataKey="You"
                  stroke="#4f46e5"
                  fill="#818cf8"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Factor-Level Summaries */}
        <div className="grid grid-cols-2 gap-6 px-8 py-4 print-section">
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">Interpersonal</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">CR + CPS + COM</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-gray-900">{interpersonal.toFixed(2)}</span>
              <span className="text-gray-300 text-sm">/ 4</span>
              <span className="text-sm text-gray-400 ml-auto">
                Team: <strong className="text-gray-600">{(td.interpersonalAvg || 0).toFixed(2)}</strong>
              </span>
            </div>
          </div>
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">Self-Management</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">GSPM + PTC</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-gray-900">{selfMgmt.toFixed(2)}</span>
              <span className="text-gray-300 text-sm">/ 4</span>
              <span className="text-sm text-gray-400 ml-auto">
                Team: <strong className="text-gray-600">{(td.selfManagementAvg || 0).toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="mx-8 mt-2 mb-6 border border-gray-100 rounded-lg p-5 print-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-rose-400" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Satisfaction with Team Collaboration</h3>
                <p className="text-xs text-gray-400">How you rated your experience working with your team</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-rose-500">{satisfaction.toFixed(1)}</span>
              <span className="text-gray-300 text-base"> / {satisfactionMax}</span>
            </div>
          </div>
          <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full"
              style={{ width: `${(satisfaction / satisfactionMax) * 100}%` }}
            />
          </div>
        </div>

        {/* ============ PAGE 2 ============ */}

        {/* Competency Descriptions — starts on page 2 in print */}
        <div className="px-8 pt-6 print-page2-start">
          <div className="flex items-center gap-2 mb-5">
            <Info className="text-indigo-500" size={18} />
            <h3 className="font-bold text-gray-800">Understanding Your Competencies</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(competencyDescriptions).map(([key, comp]) => (
              <div key={key} className="border border-gray-100 rounded-lg p-4 print-competency-item">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      comp.factor === 'Interpersonal'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {comp.short}
                    </span>
                    <span className="font-semibold text-gray-800 text-sm">{comp.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">You: <strong className="text-gray-800">{(Number(participant[key]) || 0).toFixed(1)}</strong></span>
                    <span className="text-gray-200">|</span>
                    <span className="text-gray-400">Team: <strong className="text-gray-600">{(td.averages[key] || 0).toFixed(1)}</strong></span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{comp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Disclaimer */}
        <div className="mx-8 mt-8 pt-5 border-t border-gray-100 text-xs text-gray-400 space-y-2 pb-8 print-section print-disclaimer">
          {(config.researcherName || config.piName) && (
            <div className="mb-2">
              <p className="font-semibold text-gray-600 mb-1">Contact Information</p>
              {config.researcherName && (
                <p>Researcher: {config.researcherName}{config.researcherEmail ? ` — ${config.researcherEmail}` : ''}</p>
              )}
              {config.piName && (
                <p>Principal Investigator: {config.piName}{config.piEmail ? ` — ${config.piEmail}` : ''}</p>
              )}
            </div>
          )}
          <p className="leading-relaxed">{DISCLAIMER_TEXT}</p>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Settings Panel
  // -----------------------------------------------------------------------

  const settingsPanel = (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 print-hide">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-2 text-gray-700 font-semibold hover:text-indigo-600 transition-colors w-full text-left"
      >
        <Settings size={20} />
        Study Settings
        <span className="ml-auto text-sm text-gray-400">{showSettings ? 'Hide' : 'Show'}</span>
      </button>
      {showSettings && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Researcher Name</label>
            <input
              type="text"
              value={config.researcherName}
              onChange={e => setConfig({ ...config, researcherName: e.target.value })}
              placeholder="e.g. Jane Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Researcher Email</label>
            <input
              type="email"
              value={config.researcherEmail}
              onChange={e => setConfig({ ...config, researcherEmail: e.target.value })}
              placeholder="researcher@unlv.edu"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Investigator Name</label>
            <input
              type="text"
              value={config.piName}
              onChange={e => setConfig({ ...config, piName: e.target.value })}
              placeholder="e.g. Dr. John Doe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PI Email</label>
            <input
              type="email"
              value={config.piEmail}
              onChange={e => setConfig({ ...config, piEmail: e.target.value })}
              placeholder="pi@unlv.edu"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <style>{`
        @media print {
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hide { display: none !important; }
          .print-card {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Force page 2 to start at the competency descriptions section */
          .print-page2-start {
            break-before: page !important;
            page-break-before: always !important;
            padding-top: 32px !important;
          }
          /* After each profile (disclaimer), force a break for batch mode */
          .print-card .print-disclaimer {
            page-break-after: always;
            break-after: page;
          }
          .print-card:last-child .print-disclaimer {
            page-break-after: auto;
            break-after: auto;
          }
          /* Prevent sections from being split across pages */
          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-competency-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Radar chart sized for page 1 */
          .print-chart-container { height: 280px !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 print-hide">
          Participant Feedback Generator
        </h1>
        <p className="text-center text-gray-600 mb-8 print-hide">
          Generate personalized teamwork competency profiles
        </p>

        {data.length === 0 ? (
          /* ---- Upload / Sample Data Screen ---- */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center print-hide">
            <Upload className="mx-auto mb-4 text-indigo-600" size={64} />
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Participant Data</h2>
            <label className="inline-block mb-4">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg cursor-pointer transition-colors">
                Choose CSV File
              </span>
            </label>
            <div className="mb-8">
              <span className="text-gray-400 mx-4">or</span>
              <button
                onClick={loadSampleData}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
              >
                Try with sample data
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg text-left max-w-lg mx-auto">
              <p className="font-semibold mb-3 text-gray-700">Expected CSV format:</p>
              <p className="text-xs text-gray-600 mb-2">
                Raw survey items with text responses (Completely disagree / Disagree / Agree / Completely agree).
                Items are automatically scored, reverse-coded, and averaged into subscales.
              </p>
              <code className="text-xs text-gray-600 block whitespace-pre-wrap break-all leading-relaxed">
Email_1,Team,CR1,CR16,...,Satisfaction_1,...,Satisfaction_5,...{'\n'}
user@example.com,Team A,Agree,Completely agree,...{'\n'}
</code>
              <p className="text-xs text-gray-400 mt-2">
                Also accepts pre-computed means: name,team,conflict_resolution,...,satisfaction
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ---- Settings ---- */}
            {settingsPanel}

            {/* ---- Sample Data Notice ---- */}
            {usingSampleData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 print-hide">
                <p className="text-sm text-amber-800 font-medium mb-1">Sample Data Preview</p>
                <p className="text-sm text-amber-700">
                  This demo shows a subset of the profile content. The actual participant profiles include additional
                  information that has been omitted here to avoid compromising research study procedures.
                </p>
              </div>
            )}

            {/* ---- Participant List ---- */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 print-hide">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Participants ({data.length})</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBatchPrint}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm"
                  >
                    <FileText size={18} /> Print All Profiles
                  </button>
                  <button
                    onClick={resetData}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                  >
                    Upload New File
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setBatchPrintMode(false);
                      setSelectedParticipant(selectedParticipant === idx ? null : idx);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedParticipant === idx
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.team}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ---- Single Profile View ---- */}
            {selectedParticipant !== null && !batchPrintMode && (
              <div>
                <div className="flex justify-end gap-4 mb-4 print-hide">
                  <button
                    onClick={printCard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download size={20} /> Print / Save PDF
                  </button>
                </div>
                <ParticipantCard participant={data[selectedParticipant]} />
              </div>
            )}

            {/* ---- Batch Print View ---- */}
            {batchPrintMode && (
              <div>
                <p className="text-center text-gray-600 mb-4 print-hide">
                  Rendering all profiles for printing…
                </p>
                {data.map(p => (
                  <ParticipantCard key={p.id} participant={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParticipantFeedbackGenerator;
