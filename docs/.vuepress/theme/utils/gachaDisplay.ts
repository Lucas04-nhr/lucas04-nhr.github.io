import { poolNames, type ExportLanguage, type Game } from "./gachaRecords";

const translatedPools: Record<Exclude<ExportLanguage, "en-us">, Record<Game, Record<string, string>>> = {
  "zh-cn": {
    hk4e: { "100": "新手祈愿", "200": "常驻祈愿", "301": "角色活动祈愿", "302": "武器活动祈愿", "400": "角色活动祈愿-2", "500": "集录祈愿" },
    hkrpg: { "1": "群星跃迁", "2": "始发跃迁", "11": "角色活动跃迁", "12": "光锥活动跃迁", "21": "角色联动跃迁", "22": "光锥联动跃迁" },
    nap: { "1": "常驻频道", "2": "独家频道", "3": "音擎频道", "5": "邦布频道" },
    hk4e_ugc: { "1000": "常驻唤装", "2000": "活动唤装", "20011": "活动唤装", "20012": "活动唤装", "20021": "活动唤装", "20022": "活动唤装" },
  },
  "zh-tw": {
    hk4e: { "100": "新手祈願", "200": "常駐祈願", "301": "角色活動祈願", "302": "武器活動祈願", "400": "角色活動祈願-2", "500": "集錄祈願" },
    hkrpg: { "1": "群星躍遷", "2": "始發躍遷", "11": "角色活動躍遷", "12": "光錐活動躍遷", "21": "角色聯動躍遷", "22": "光錐聯動躍遷" },
    nap: { "1": "常駐頻道", "2": "獨家頻道", "3": "音擎頻道", "5": "邦布頻道" },
    hk4e_ugc: { "1000": "常駐喚裝", "2000": "活動喚裝", "20011": "活動喚裝", "20012": "活動喚裝", "20021": "活動喚裝", "20022": "活動喚裝" },
  },
  "ja-jp": {
    hk4e: { "100": "初心者応援祈願", "200": "通常祈願", "301": "イベント祈願・キャラクター", "302": "イベント祈願・武器", "400": "イベント祈願・キャラクター2", "500": "集録祈願" },
    hkrpg: { "1": "群星跳躍", "2": "始発跳躍", "11": "イベント跳躍・キャラクター", "12": "イベント跳躍・光円錐", "21": "コラボ跳躍・キャラクター", "22": "コラボ跳躍・光円錐" },
    nap: { "1": "常設チャンネル", "2": "独占チャンネル", "3": "音動機チャンネル", "5": "ボンプチャンネル" },
    hk4e_ugc: { "1000": "通常衣装召喚", "2000": "イベント衣装召喚", "20011": "イベント衣装召喚", "20012": "イベント衣装召喚", "20021": "イベント衣装召喚", "20022": "イベント衣装召喚" },
  },
};
const labels: Record<ExportLanguage, Record<string, string>> = {
  "en-us": { miliastra: "Miliastra", all: "All pools" },
  "zh-cn": { miliastra: "千星奇域", all: "全部卡池", "Celestia / Irminsul": "天空岛 / 世界树", "Astral Express · Nameless": "星穹列车 · 无名客", "New Eridu": "新艾利都", Asia: "亚洲", Europe: "欧洲", America: "美洲", "TW / HK / MO": "台 / 港 / 澳", "China / Asia / TW-HK-MO": "中国大陆 / 亚洲 / 台港澳", Server: "服务器" },
  "zh-tw": { miliastra: "千星奇域", all: "全部卡池", "Celestia / Irminsul": "天空島 / 世界樹", "Astral Express · Nameless": "星穹列車 · 無名客", "New Eridu": "新艾利都", Asia: "亞洲", Europe: "歐洲", America: "美洲", "TW / HK / MO": "台 / 港 / 澳", "China / Asia / TW-HK-MO": "中國大陸 / 亞洲 / 台港澳", Server: "伺服器" },
  "ja-jp": { miliastra: "星々の幻境", all: "すべてのガチャ", "Celestia / Irminsul": "天空島 / 世界樹", "Astral Express · Nameless": "星穹列車 · ナナシビト", "New Eridu": "新エリー都", Asia: "アジア", Europe: "ヨーロッパ", America: "アメリカ", "TW / HK / MO": "台湾 / 香港 / マカオ", "China / Asia / TW-HK-MO": "中国 / アジア / 台湾・香港・マカオ", Server: "サーバー" },
};
export function displayLabel(label: string, language: ExportLanguage): string {
  if (label.startsWith("Server UTC")) return `${labels[language].Server ?? "Server"} ${label.slice(7)}`;
  return labels[language][label] ?? label;
}
export function localizedPoolName(game: Game, type: string, language: ExportLanguage): string {
  const name = (language === "en-us" ? poolNames : translatedPools[language])[game][type] ?? type;
  return `${game === "hk4e_ugc" ? `${displayLabel("miliastra", language)} · ` : ""}${name}`;
}
