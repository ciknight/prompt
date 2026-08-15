// scripts/lib/toSlug.mjs
// Minimal Chinese → pinyin mapping for characters in our 44 files.
// Other characters fall through to their ASCII / remain transliterated.

const PINYIN = {
  '漫': 'man', '剧': 'ju', '剧': 'ju', '分': 'fen', '镜': 'jing',
  '衔': 'xian', '接': 'jie', '指': 'zhi', '令': 'ling',
  '秒': 'miao', '文': 'wen', '案': 'an', '幕': 'mu',
  '改': 'gai', '词': 'ci', '人': 'ren', '物': 'wu',
  '场': 'chang', '景': 'jing', '道': 'dao', '具': 'ju',
  '提': 'ti', '取': 'qu', '豆': 'dou', '包': 'bao',
  '训': 'xun', '练': 'lian', '其': 'qi', '他': 'ta',
  '仿': 'fang', '真': 'zhen', '提': 'ti', '示': 'shi',
  '故': 'gu', '事': 'shi', '制': 'zhi', '作': 'zuo',
  '级': 'ji', '三': 'san', '视': 'shi', '图': 'tu',
  '脸': 'lian', '建': 'jian', '模': 'mo', '比': 'bi',
  '对': 'dui', '飞': 'fei', '行': 'xing', '一': 'yi',
  '镜': 'jing', '到': 'dao', '底': 'di', '打': 'da',
  '斗': 'dou', '炫': 'xuan', '酷': 'ku', '特': 'te',
  '效': 'xiao', '风': 'feng', '格': 'ge',
  '实': 'shi', '战': 'zhan',
};

export function toSlug(input) {
  const stripped = input
    .replace(/\.[^.]+$/, '')         // remove extension
    .replace(/[()（）\[\]【】]/g, '') // remove brackets
    .replace(/[、，,。：:]/g, '-');   // punctuation → dash

  const pinyinized = [...stripped].map(ch => {
    if (/[a-zA-Z0-9-]/.test(ch)) return ch;
    if (PINYIN[ch]) return PINYIN[ch];
    return ''; // skip unknown chars
  }).join('');

  return pinyinized
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}