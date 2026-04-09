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
  // User mapping: 1・2Q -> 前期, 3・4Q -> 後期, 1-4Q -> 通年
  result = result.replace('①②③④(通)', '通年');
  result = result.replace('①②(通)', '前期');
  result = result.replace('③④(通)', '後期');
  
  // Handle individual quarters
  result = result.replace('①', '1Q');
  result = result.replace('②', '2Q');
  result = result.replace('③', '3Q');
  result = result.replace('④', '4Q');

  // Specific mappings for combined notations if they occur in data
  result = result.replace('1・2Q', '前期');
  result = result.replace('3・4Q', '後期');
  result = result.replace('1-4Q', '通年');

  // Handle standalone 通
  if (result.endsWith('通')) {
    result = result.replace('通', '通年');
  }

  return result;
}
