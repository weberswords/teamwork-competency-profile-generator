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

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

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

    setData(parsedData);
    calculateTeamStats(parsedData);
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
  };

  const resetData = () => {
    setData([]);
    setSelectedParticipant(null);
    setTeamStats({});
    setBatchPrintMode(false);
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
        className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl p-8 max-w-3xl mx-auto mb-8 print-card"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            Collaborative Problem Solving Study
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{name}</h1>
          <p className="text-gray-600">Thank you for your valuable contribution to our research!</p>
        </div>

        {/* Team Info Banner */}
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl mb-6 ${
          td.isHighAgreement
            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
        }`}>
          <Users className={td.isHighAgreement ? 'text-emerald-600' : 'text-amber-600'} size={24} />
          <span className="font-semibold text-gray-800">Team: {team}</span>
          <span className="mx-2 text-gray-400">|</span>
          {td.isHighAgreement ? (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle size={18} />
              High Agreement Team
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-700">
              <Shuffle size={18} />
              Diverse Competency Team
            </span>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Your Teamwork Competency Profile</h2>
          <p className="text-sm text-gray-500 text-center mb-4">Your responses compared to your team's average (Scale: 1–4)</p>
          <ResponsiveContainer width="100%" height={320}>
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
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Radar
                name="You"
                dataKey="You"
                stroke="#4f46e5"
                fill="#818cf8"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Factor-Level Summaries */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Interpersonal</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">CR + CPS + COM</p>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-bold text-indigo-600">{interpersonal.toFixed(2)}</span>
                <span className="text-gray-400 text-sm"> / 4</span>
              </div>
              <div className="text-sm text-gray-500">
                Team: <strong className="text-gray-700">{(td.interpersonalAvg || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">Self-Management</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">GSPM + PTC</p>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-bold text-indigo-600">{selfMgmt.toFixed(2)}</span>
                <span className="text-gray-400 text-sm"> / 4</span>
              </div>
              <div className="text-sm text-gray-500">
                Team: <strong className="text-gray-700">{(td.selfManagementAvg || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-rose-500" size={24} />
              <div>
                <h3 className="font-bold text-gray-800">Your Satisfaction with Team Collaboration</h3>
                <p className="text-sm text-gray-500">How you rated your experience working with your team</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-rose-500">{satisfaction.toFixed(1)}</span>
              <span className="text-gray-400 text-lg"> / 5</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all"
              style={{ width: `${(satisfaction / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Competency Descriptions */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Info className="text-indigo-600" size={20} />
            <h3 className="font-bold text-gray-800">Understanding Your Competencies</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(competencyDescriptions).map(([key, comp]) => (
              <div key={key} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      comp.factor === 'Interpersonal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {comp.short}
                    </span>
                    <span className="font-semibold text-gray-800">{comp.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">You: <strong className="text-indigo-600">{(Number(participant[key]) || 0).toFixed(1)}</strong></span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">Team: <strong className="text-gray-600">{(td.averages[key] || 0).toFixed(1)}</strong></span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{comp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Disclaimer */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500 space-y-3">
          {(config.researcherName || config.piName) && (
            <div>
              <p className="font-semibold text-gray-700 mb-1">Contact Information</p>
              {config.researcherName && (
                <p>Researcher: {config.researcherName}{config.researcherEmail ? ` \u2014 ${config.researcherEmail}` : ''}</p>
              )}
              {config.piName && (
                <p>Principal Investigator: {config.piName}{config.piEmail ? ` \u2014 ${config.piEmail}` : ''}</p>
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

  const SettingsPanel = () => (
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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-8">
      <style>{`
        @media print {
          body, html {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hide { display: none !important; }
          .print-card {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-card:last-child {
            page-break-after: auto;
          }
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
              <p className="font-semibold mb-3 text-gray-700">Expected CSV columns:</p>
              <code className="text-xs text-gray-600 block whitespace-pre-wrap leading-relaxed">
name,team,conflict_resolution,collaborative_problem_solving,communication,goal_setting,planning_coordination,satisfaction

Alice,Team A,3.2,2.8,3.5,3.1,2.9,4.5
Bob,Team A,2.9,3.1,3.0,3.4,3.2,3.8</code>
            </div>
          </div>
        ) : (
          <>
            {/* ---- Settings ---- */}
            <SettingsPanel />

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
