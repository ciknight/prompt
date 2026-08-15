// scripts/lib/slug-map.mjs
// Maps every source filename → canonical slug.
// Defined manually to avoid slug collisions and ensure stable URLs.

export const SLUG_MAP = {
  // 根目录 (8)
  '其他.txt': 'qita-zonghe',
  '场景四视图.txt': 'changjing-sishitu',
  '改文提示词.txt': 'gaiwen-tici',
  '文案分幕.txt': 'wenan-fenmu',
  '漫剧人物场景道具提取指令.txt': 'manju-renwu-changjing-daoju',
  '漫剧剧本分镜衔接指令(10秒).txt': 'manju-fenjing-jiehe-10s',
  '漫剧剧本分镜衔接指令(15秒).txt': 'manju-fenjing-jiehe-15s',
  '豆包大模型训练词.txt': 'doubao-damo-xunlianci',

  // 仿真人提示词/ (6)
  '仿真人提示词/GPT故事制作.txt': 'gpt-gushi-zhizuo',
  '仿真人提示词/S级漫剧人物提示词.txt': 's-ji-manju-renwu',
  '仿真人提示词/S级漫剧场景.txt': 's-ji-manju-changjing',
  '仿真人提示词/三视图.txt': 'sanshitu',
  '仿真人提示词/人脸提示词.txt': 'renlian-tici',
  '仿真人提示词/仿真人分镜衔接指令.txt': 'fangzhengren-fenjing-jiehe',

  // 其他/ (5)
  '其他/人物建模提示词.txt': 'renwu-jianmo-tici',
  '其他/对比、飞行、一镜到底、打斗提示词.txt': 'duibi-feixing-yijing-daoda-dadou',
  '其他/炫酷打斗视频提示词.txt': 'xuanku-dadou-shipin',
  '其他/特效镜头提示词.txt': 'texiao-jingtou-tici',
  '其他/视频风格提示词.txt': 'shipin-fengge-tici',

  // 实战/ (28)
  '实战/10种热门AI修图玩法教程和提示词.docx': '10-rementu-xiutu-wanfa',
  '实战/3D字体材质3提示词和教程.docx': '3d-ziti-caizhi-3',
  '实战/AI直出全套IP设计｜完整提示词.docx': 'ai-zhichu-quantao-ip',
  '实战/AI直出全套系列IP设计｜完整提示词.docx': 'ai-zhichu-xilie-ip',
  '实战/shotlab丧尸清道夫图片资产拆解.docx': 'shotlab-jiangshi-qingdaofu',
  '实战/《ai无人机航拍》提示词和操作流程.docx': 'ai-wurenji-hangpai',
  '实战/《Huang GenLab》品牌作品集提示词.docx': 'huang-genlab-pinpai',
  '实战/《人物微表情》提示词和操作流程.docx': 'renwu-wei-biaoqing',
  '实战/《多角色动画短片》提示词和操作流程.txt': 'duojuese-donghua-duanpian',
  '实战/《学姐包粽子动画短片》提示词和操作流程.docx': 'xuejie-baozongzi-donghua',
  '实战/《年中述职》可编辑ppt提示词和教程.txt': 'nianzhong-shuzhi-ppt',
  '实战/《手柄TVC产品广告》提示词和操作流程.txt': 'shoubing-tvc-guanggao',
  '实战/《暴燃熊健身房》可编辑psd品牌全案提示词和教程.docx': 'baoranxiong-jianshenfang-pinpai',
  '实战/《梨园双星》故事板seedance2.5.txt': 'liyuan-shuangxing-gushiban',
  '实战/《棒球比赛大屏》提示词和操作流程.docx': 'bangqiu-bisai-daping',
  '实战/《灰域追击》故事板提示词和操作流程.docx': 'huiyu-zhuiji-gushiban',
  '实战/《骨冠双猎》故事板提示词和操作流程.docx': 'guguan-shuanglie-gushiban',
  '实战/别让你的IP【呆板】的站着｜完整提示词.docx': 'bie-rang-ip-daibai-zhanzhe',
  '实战/动漫角色pv教程和提示词.txt': 'dongman-juese-pv',
  '实战/古风ai短剧提示词和教程.txt': 'gufeng-ai-duanju',
  '实战/品牌手册+UI可编辑设计稿提示词.docx': 'pinpai-shouce-ui',
  '实战/好莱坞风格短剧提示词和教程.txt': 'haolaiwu-fengge-duanju',
  '实战/字体材质1提示词和教程.docx': 'ziti-caizhi-1',
  '实战/布料拼接字体材质4提示词和教程.docx': 'buliao-pinjie-ziti-4',
  '实战/角色微表情提示词.txt': 'juese-wei-biaoqing',
  '实战/角色微表情提示词3.txt': 'juese-wei-biaoqing-3',
  '实战/（烘焙）字体材质2提示词和教程.docx': 'hongbei-ziti-caizhi-2',
};

export function resolveSlug(filename) {
  const slug = SLUG_MAP[filename];
  if (!slug) throw new Error(`unknown file in slug-map: ${filename}`);
  return slug;
}
