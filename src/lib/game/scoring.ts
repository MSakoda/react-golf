export function getFinishName(strokes: number, par: number) {
  const relation = strokes - par;
  if (strokes === 1) return "Hole in one";
  if (relation <= -3) return "Albatross";
  if (relation === -2) return "Eagle";
  if (relation === -1) return "Birdie";
  if (relation === 0) return "Par";
  if (relation === 1) return "Bogey";
  if (relation === 2) return "Double bogey";
  return "Triple bogey or worse";
}
