export function formatTerm(termStr) {
  if (!termStr) return "";

  // Extract the year (first digit usually)
  let result = termStr;
  
  // Replace the first digit with "X年 "
  result = result.replace(/^(\d)/, '$1年 ');

  // Replace Semester terms
  result = result.replace('前', '前期');
  result = result.replace('後', '後期');
  
  // Replace Quarter terms
  // Handle continuous quarters first like ①②(通) -> 第1・2Q
  result = result.replace('①②③④(通)', '第1〜4クオーター');
  result = result.replace('①②(通)', '第1・2クオーター');
  result = result.replace('③④(通)', '第3・4クオーター');
  
  // Handle individual quarters
  result = result.replace('①', '第1クオーター');
  result = result.replace('②', '第2クオーター');
  result = result.replace('③', '第3クオーター');
  result = result.replace('④', '第4クオーター');

  // Handle standalone 通
  // Make sure it wasn't already consumed by the Q replacements. 
  // If "通" is exactly at the end after the year, it means full year.
  if (result.endsWith('通')) {
    result = result.replace('通', '通年');
  }

  return result;
}
