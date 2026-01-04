/**
 * getProgressColor
 * @param progress A number between 0 and 100 representing the completion percentage.
 * @returns A string representing the color corresponding to the progress.
 */
function getProgressColor(progress: number): string {
  if (progress >= 100) {
    return 'var(--color-blue)';
  }
  if (progress >= 21) {
    return 'var(--color-green)';
  }
  return 'var(--color-red)';
}

function renderFlowTickBar(flowTickContainerEl: Element, progress: number) {
  const color = getProgressColor(progress);

  const flowtickBarEl =
    flowTickContainerEl.find('.flowtick-bar') ??
    flowTickContainerEl.createDiv('flowtick-bar');

  const flowtickFillEl =
    flowtickBarEl.find('.flowtick-fill') ??
    flowtickBarEl.createDiv('flowtick-fill');

  flowtickFillEl.setAttr('style', `width:${progress}%; background:${color};`);
}

export { renderFlowTickBar, getProgressColor };
