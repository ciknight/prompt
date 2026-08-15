// scripts/lib/tag-slug.mjs
// Closed-vocabulary pinyin slugs for every tag used in tags-map.mjs.
// ASCII tags pass through unchanged.

export const TAG_SLUGS = {
  // 维度 (dimension)
  '竖屏': 'shuping',
  '漫剧': 'manju',
  '真人': 'zhenren',
  '3D': '3d',
  '写实': 'xieshi',
  '电影感': 'dianyinggan',
  '视频': 'shipin',
  // 技法 (technique)
  '分镜': 'fenjing',
  '运镜': 'yunjing',
  '一镜到底': 'yijing-daodi',
  '打斗': 'dadou',
  '特效': 'texiao',
  '微表情': 'weibiaoqing',
  // 资产 (asset)
  '人物': 'renwu',
  '场景': 'changjing',
  '道具': 'daoju',
  'IP': 'ip',
  '字体': 'ziti',
  '材质': 'caizhi',
  'UI': 'ui',
  'PPT': 'ppt',
};

const SLUG_TO_TAG = Object.fromEntries(
  Object.entries(TAG_SLUGS).map(([name, slug]) => [slug, name])
);

export function tagSlug(name) {
  return TAG_SLUGS[name] ?? name;
}

export function tagFromSlug(slug) {
  return SLUG_TO_TAG[slug] ?? slug;
}