// MLB Stats API team id -> Traditional Chinese display info.
// Names follow common Taiwan sports-media usage (ETtoday / TSNA style).
export const TEAMS = {
  108: { full: '洛杉磯天使', short: '天使', abbr: 'LAA', color: '#BA0021' },
  109: { full: '亞利桑那響尾蛇', short: '響尾蛇', abbr: 'ARI', color: '#A71930' },
  110: { full: '巴爾的摩金鶯', short: '金鶯', abbr: 'BAL', color: '#DF4601' },
  111: { full: '波士頓紅襪', short: '紅襪', abbr: 'BOS', color: '#BD3039' },
  112: { full: '芝加哥小熊', short: '小熊', abbr: 'CHC', color: '#0E3386' },
  113: { full: '辛辛那提紅人', short: '紅人', abbr: 'CIN', color: '#C6011F' },
  114: { full: '克里夫蘭守護者', short: '守護者', abbr: 'CLE', color: '#00385D' },
  115: { full: '科羅拉多落磯', short: '落磯', abbr: 'COL', color: '#333366' },
  116: { full: '底特律老虎', short: '老虎', abbr: 'DET', color: '#0C2340' },
  117: { full: '休士頓太空人', short: '太空人', abbr: 'HOU', color: '#002D62' },
  118: { full: '堪薩斯皇家', short: '皇家', abbr: 'KC', color: '#004687' },
  119: { full: '洛杉磯道奇', short: '道奇', abbr: 'LAD', color: '#005A9C' },
  120: { full: '華盛頓國民', short: '國民', abbr: 'WSH', color: '#AB0003' },
  121: { full: '紐約大都會', short: '大都會', abbr: 'NYM', color: '#002D72' },
  133: { full: '奧克蘭運動家', short: '運動家', abbr: 'ATH', color: '#003831' },
  134: { full: '匹茲堡海盜', short: '海盜', abbr: 'PIT', color: '#FDB827' },
  135: { full: '聖地牙哥教士', short: '教士', abbr: 'SD', color: '#2F241D' },
  136: { full: '西雅圖水手', short: '水手', abbr: 'SEA', color: '#0C2C56' },
  137: { full: '舊金山巨人', short: '巨人', abbr: 'SF', color: '#FD5A1E' },
  138: { full: '聖路易紅雀', short: '紅雀', abbr: 'STL', color: '#C41E3A' },
  139: { full: '坦帕灣光芒', short: '光芒', abbr: 'TB', color: '#092C5C' },
  140: { full: '德州遊騎兵', short: '遊騎兵', abbr: 'TEX', color: '#003278' },
  141: { full: '多倫多藍鳥', short: '藍鳥', abbr: 'TOR', color: '#134A8E' },
  142: { full: '明尼蘇達雙城', short: '雙城', abbr: 'MIN', color: '#002B5C' },
  143: { full: '費城費城人', short: '費城人', abbr: 'PHI', color: '#E81828' },
  144: { full: '亞特蘭大勇士', short: '勇士', abbr: 'ATL', color: '#CE1141' },
  145: { full: '芝加哥白襪', short: '白襪', abbr: 'CWS', color: '#27251F' },
  146: { full: '邁阿密馬林魚', short: '馬林魚', abbr: 'MIA', color: '#00A3E0' },
  147: { full: '紐約洋基', short: '洋基', abbr: 'NYY', color: '#003087' },
  158: { full: '密爾瓦基釀酒人', short: '釀酒人', abbr: 'MIL', color: '#12284B' },
};

export function teamInfo(id) {
  return TEAMS[id] || { full: `未知隊伍 #${id}`, short: `#${id}`, abbr: '???', color: '#555555' };
}

// MLB's own official team-logo CDN -- same asset ESPN/other MLB-data sites
// reference directly, no auth, one URL per team id.
export function teamLogoUrl(id) {
  return `https://www.mlbstatic.com/team-logos/${id}.svg`;
}
