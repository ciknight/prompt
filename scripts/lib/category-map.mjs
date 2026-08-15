// scripts/lib/category-map.mjs

// Display names (Chinese, what users see)
export const CATEGORIES = [
  '剧本分镜',
  '角色与IP',
  '场景视觉',
  '视频生成',
  '品牌与商业',
  '动画短片',
  '技能',
];

// URL slugs (pinyin, what URLs use — no Chinese characters)
export const CATEGORY_SLUGS = {
  '剧本分镜': 'juben-fenjing',
  '角色与IP': 'juese-yu-ip',
  '场景视觉': 'changjing-shijue',
  '视频生成': 'shipin-shengcheng',
  '品牌与商业': 'pinpai-yu-shangye',
  '动画短片': 'donghua-duanpian',
  '技能': 'skill',
};

// Reverse lookup: slug → display name
export const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([name, slug]) => [slug, name])
);

export const CATEGORY_MAP = {
  // 剧本分镜
  '其他.txt': '剧本分镜',
  '场景四视图.txt': '剧本分镜',
  '改文提示词.txt': '剧本分镜',
  '文案分幕.txt': '剧本分镜',
  '漫剧人物场景道具提取指令.txt': '剧本分镜',
  '漫剧剧本分镜衔接指令(10秒).txt': '剧本分镜',
  '漫剧剧本分镜衔接指令(15秒).txt': '剧本分镜',
  '仿真人提示词/仿真人分镜衔接指令.txt': '剧本分镜',
  '仿真人提示词/GPT故事制作.txt': '剧本分镜',

  // 角色与IP
  '仿真人提示词/S级漫剧人物提示词.txt': '角色与IP',
  '仿真人提示词/人脸提示词.txt': '角色与IP',
  '其他/人物建模提示词.txt': '角色与IP',
  '实战/《人物微表情》提示词和操作流程.docx': '角色与IP',
  '实战/AI直出全套IP设计｜完整提示词.docx': '角色与IP',
  '实战/AI直出全套系列IP设计｜完整提示词.docx': '角色与IP',
  '实战/shotlab丧尸清道夫图片资产拆解.docx': '角色与IP',
  '实战/别让你的IP【呆板】的站着｜完整提示词.docx': '角色与IP',
  '实战/角色微表情提示词.txt': '角色与IP',
  '实战/角色微表情提示词3.txt': '角色与IP',

  // 场景视觉
  '仿真人提示词/S级漫剧场景.txt': '场景视觉',
  '仿真人提示词/三视图.txt': '场景视觉',
  '实战/3D字体材质3提示词和教程.docx': '场景视觉',
  '实战/字体材质1提示词和教程.docx': '场景视觉',
  '实战/布料拼接字体材质4提示词和教程.docx': '场景视觉',
  '实战/（烘焙）字体材质2提示词和教程.docx': '场景视觉',

  // 视频生成
  '豆包大模型训练词.txt': '视频生成',
  '角色pv教程和提示词2.docx': '动画短片',
  '其他/对比、飞行、一镜到底、打斗提示词.txt': '视频生成',
  '其他/炫酷打斗视频提示词.txt': '视频生成',
  '其他/特效镜头提示词.txt': '视频生成',
  '其他/视频风格提示词.txt': '视频生成',

  // 品牌与商业
  '实战/《Huang GenLab》品牌作品集提示词.docx': '品牌与商业',
  '实战/《暴燃熊健身房》可编辑psd品牌全案提示词和教程.docx': '品牌与商业',
  '实战/《年中述职》可编辑ppt提示词和教程.txt': '品牌与商业',
  '实战/《手柄TVC产品广告》提示词和操作流程.txt': '品牌与商业',
  '实战/《棒球比赛大屏》提示词和操作流程.docx': '品牌与商业',
  '实战/《ai无人机航拍》提示词和操作流程.docx': '品牌与商业',
  '实战/品牌手册+UI可编辑设计稿提示词.docx': '品牌与商业',

  // 动画短片
  '实战/《多角色动画短片》提示词和操作流程.txt': '动画短片',
  '实战/《学姐包粽子动画短片》提示词和操作流程.docx': '动画短片',
  '实战/《梨园双星》故事板seedance2.5.txt': '动画短片',
  '实战/《灰域追击》故事板提示词和操作流程.docx': '动画短片',
  '实战/《骨冠双猎》故事板提示词和操作流程.docx': '动画短片',
  '实战/动漫角色pv教程和提示词.txt': '动画短片',
  '实战/古风ai短剧提示词和教程.txt': '动画短片',
  '实战/好莱坞风格短剧提示词和教程.txt': '动画短片',
  '实战/10种热门AI修图玩法教程和提示词.docx': '动画短片',
};

export function resolveCategory(filename) {
  const cat = CATEGORY_MAP[filename];
  if (!cat) throw new Error(`no category for: ${filename}`);
  return cat;
}

export function categorySlug(name) {
  const slug = CATEGORY_SLUGS[name];
  if (!slug) throw new Error(`no slug for category: ${name}`);
  return slug;
}

export function categoryFromSlug(slug) {
  const name = SLUG_TO_CATEGORY[slug];
  if (!name) throw new Error(`unknown category slug: ${slug}`);
  return name;
}