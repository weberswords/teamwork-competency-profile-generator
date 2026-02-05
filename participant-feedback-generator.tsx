import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Upload, Download, Users, Heart, Info, CheckCircle, Shuffle } from 'lucide-react';

const competencyDescriptions = {
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
    name: "Goal Setting & Performance Management",
    short: "GSPM",
    description: "Involves establishing specific and challenging team objectives, monitoring progress toward goals, and providing constructive feedback on team activities.",
    factor: "Self-Management"
  },
  planning_coordination: {
    name: "Planning & Task Coordination",
    short: "PTC",
    description: "Requires coordinating activities and information between team members, establishing appropriate role assignments, and managing workload distribution effectively.",
    factor: "Self-Management"
  }
};

const ParticipantFeedbackGenerator = () => {
  const [data, setData] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [teamStats, setTeamStats] = useState({});

  const printCard = () => {
    window.print();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target.result);
      reader.readAsText(file);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    
    const parsedData = lines.slice(1)
      .filter(line => line.trim())
      .map((line, idx) => {
        const values = line.split(',').map(v => v.trim());
        const obj = { id: idx };
        headers.forEach((header, index) => {
          obj[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
        });
        return obj;
      });

    setData(parsedData);
    calculateTeamStats(parsedData);
  };

  const calculateTeamStats = (participants) => {
    const teams = {};
    const competencies = ['conflict_resolution', 'collaborative_problem_solving', 'communication', 'goal_setting', 'planning_coordination'];
    
    participants.forEach(p => {
      const team = p.team || 'Unassigned';
      if (!teams[team]) {
        teams[team] = { members: [], competencyTotals: {}, count: 0 };
        competencies.forEach(c => teams[team].competencyTotals[c] = 0);
      }
      teams[team].members.push(p);
      teams[team].count += 1;
      competencies.forEach(c => {
        teams[team].competencyTotals[c] += (p[c] || 0);
      });
    });

    Object.keys(teams).forEach(team => {
      teams[team].averages = {};
      competencies.forEach(c => {
        teams[team].averages[c] = teams[team].competencyTotals[c] / teams[team].count;
      });
      
      // Calculate overall score for each member
      teams[team].members.forEach(member => {
        const interpersonal = ((member.conflict_resolution || 0) + (member.collaborative_problem_solving || 0) + (member.communication || 0)) / 3;
        const selfMgmt = ((member.goal_setting || 0) + (member.planning_coordination || 0)) / 2;
        member.overallScore = (interpersonal + selfMgmt) / 2;
      });
      
      // Calculate team mean overall score
      const teamMeanOverall = teams[team].members.reduce((sum, m) => sum + m.overallScore, 0) / teams[team].count;
      teams[team].teamMeanOverall = teamMeanOverall;
      
      // Calculate high agreement (70%+ within ±0.3 of team mean)
      const membersInAgreement = teams[team].members.filter(m => 
        Math.abs(m.overallScore - teamMeanOverall) <= 0.3
      ).length;
      teams[team].agreementPercentage = (membersInAgreement / teams[team].count) * 100;
      teams[team].isHighAgreement = teams[team].agreementPercentage >= 70;
    });

    setTeamStats(teams);
  };

  const ParticipantCard = ({ participant }) => {
    const team = participant.team || 'Unassigned';
    const name = participant.name || 'Participant';
    const teamData = teamStats[team] || { averages: {}, isHighAgreement: false };
    const satisfaction = participant.satisfaction || 0;

    const radarData = Object.keys(competencyDescriptions).map(key => ({
      competency: competencyDescriptions[key].short,
      fullName: competencyDescriptions[key].name,
      You: participant[key] || 0,
      'Team Average': teamData.averages[key] || 0,
    }));

    return (
      <div id={`card-${participant.id}`} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl p-8 max-w-3xl mx-auto mb-8 print-card">
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
          teamData.isHighAgreement 
            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
        }`}>
          <Users className={teamData.isHighAgreement ? 'text-emerald-600' : 'text-amber-600'} size={24} />
          <span className="font-semibold text-gray-800">Team: {team}</span>
          <span className="mx-2 text-gray-400">|</span>
          {teamData.isHighAgreement ? (
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
          <p className="text-sm text-gray-500 text-center mb-4">Your responses compared to your team's average (Scale: 1-4)</p>
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
                    <span className="text-gray-500">You: <strong className="text-indigo-600">{(participant[key] || 0).toFixed(1)}</strong></span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">Team: <strong className="text-gray-600">{(teamData.averages[key] || 0).toFixed(1)}</strong></span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{comp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Your participation helps us understand collaborative problem solving in software teams.</p>
          <p className="mt-2 font-semibold text-indigo-600">Thank you for making a difference!</p>
        </div>
      </div>
    );
  };

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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 print-hide">Participant Feedback Generator</h1>
        <p className="text-center text-gray-600 mb-8 print-hide">Generate personalized teamwork competency profiles</p>

        {data.length === 0 ? (
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
                onClick={() => {
                  const dummyData = [
                    { id: 0, name: "Alex Chen", team: "Team Alpha", conflict_resolution: 3.4, collaborative_problem_solving: 3.1, communication: 3.6, goal_setting: 2.9, planning_coordination: 3.2, satisfaction: 5.8 },
                    { id: 1, name: "Jordan Smith", team: "Team Alpha", conflict_resolution: 3.2, collaborative_problem_solving: 3.3, communication: 3.1, goal_setting: 3.0, planning_coordination: 3.1, satisfaction: 6.2 },
                    { id: 2, name: "Sam Rodriguez", team: "Team Alpha", conflict_resolution: 3.0, collaborative_problem_solving: 2.9, communication: 3.4, goal_setting: 3.2, planning_coordination: 2.8, satisfaction: 5.5 },
                    { id: 3, name: "Taylor Kim", team: "Team Alpha", conflict_resolution: 3.3, collaborative_problem_solving: 3.2, communication: 3.2, goal_setting: 3.1, planning_coordination: 3.0, satisfaction: 6.0 },
                    { id: 4, name: "Morgan Lee", team: "Team Beta", conflict_resolution: 2.4, collaborative_problem_solving: 3.5, communication: 2.8, goal_setting: 3.6, planning_coordination: 3.4, satisfaction: 4.8 },
                    { id: 5, name: "Casey Johnson", team: "Team Beta", conflict_resolution: 3.8, collaborative_problem_solving: 2.6, communication: 3.2, goal_setting: 2.4, planning_coordination: 2.9, satisfaction: 5.2 },
                    { id: 6, name: "Riley Davis", team: "Team Beta", conflict_resolution: 2.9, collaborative_problem_solving: 3.1, communication: 2.5, goal_setting: 3.0, planning_coordination: 3.7, satisfaction: 4.5 },
                    { id: 7, name: "Jamie Wilson", team: "Team Beta", conflict_resolution: 3.1, collaborative_problem_solving: 2.8, communication: 3.6, goal_setting: 2.7, planning_coordination: 2.6, satisfaction: 4.2 },
                    { id: 8, name: "Quinn Harper", team: "Team Gamma", conflict_resolution: 3.9, collaborative_problem_solving: 3.7, communication: 3.8, goal_setting: 3.6, planning_coordination: 3.5, satisfaction: 4.8 },
                    { id: 9, name: "Avery Thompson", team: "Team Gamma", conflict_resolution: 2.1, collaborative_problem_solving: 2.3, communication: 2.0, goal_setting: 2.2, planning_coordination: 2.4, satisfaction: 3.2 },
                    { id: 10, name: "Drew Martinez", team: "Team Gamma", conflict_resolution: 3.2, collaborative_problem_solving: 2.8, communication: 3.0, goal_setting: 2.9, planning_coordination: 3.1, satisfaction: 3.8 },
                    { id: 11, name: "Reese Patel", team: "Team Gamma", conflict_resolution: 1.8, collaborative_problem_solving: 2.0, communication: 2.2, goal_setting: 1.9, planning_coordination: 2.1, satisfaction: 2.9 },
                  ];
                  setData(dummyData);
                  calculateTeamStats(dummyData);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
              >
                Try with sample data
              </button>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg text-left max-w-lg mx-auto">
              <p className="font-semibold mb-3 text-gray-700">Expected CSV columns:</p>
              <code className="text-xs text-gray-600 block whitespace-pre-wrap leading-relaxed">
name,team,conflict_resolution,collaborative_problem_solving,communication,goal_setting,planning_coordination,satisfaction

Alice,Team A,3.2,2.8,3.5,3.1,2.9,5.5
Bob,Team A,2.9,3.1,3.0,3.4,3.2,6.0</code>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 print-hide">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Participants ({data.length})</h2>
                <button onClick={() => { setData([]); setSelectedParticipant(null); setTeamStats({}); }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">
                  Upload New File
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.map((p, idx) => (
                  <button key={idx}
                    onClick={() => setSelectedParticipant(selectedParticipant === idx ? null : idx)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedParticipant === idx ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}>
                    <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.team}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedParticipant !== null && (
              <div>
                <div className="flex justify-end gap-4 mb-4 print-hide">
                  <button onClick={printCard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 print:hidden">
                    <Download size={20} /> Print / Save PDF
                  </button>
                </div>
                <ParticipantCard participant={data[selectedParticipant]} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParticipantFeedbackGenerator;