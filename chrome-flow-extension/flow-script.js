function findButtonByText(text) {
  const elements = Array.from(document.querySelectorAll('button, [role="button"], a'));
  return elements.find(el => (el.textContent || '').trim() === text || (el.getAttribute('aria-label') || '').trim() === text);
}

const btn = findButtonByText('New project');
if (btn) {
  btn.click();
  console.log('Flow script: clicked New project');
} else {
  console.error('Flow script: New project button not found');
}
