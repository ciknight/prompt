// scripts/lib/parseXlsx.mjs
// We do NOT parse xlsx content. xlsx files are too large (40MB) and
// tabular; we generate a placeholder markdown that explains the file
// and points users to the archived original.

export async function parseXlsx(filename) {
  const markdown = `> ⚠️ **这是一个 Excel 表格文件**
>
> 原始文件：\`${filename}\`
> 表格内容不适合在网页中完整渲染。请在本地打开（用 Excel/WPS）查看，或下载原文件查看。
>
> 归档路径：\`archive/${filename.replace(/^.+[\\/]/, '')}\`
`;
  return { markdown };
}
