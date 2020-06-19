const {
  settings,
  writeSettings,
  isURL,
  suggestCommands,
  onCancel,
  getChoices,
  selectProject,
  selectScript,
} = require('./helper');

test('`settings` is a object', () => {
  expect(typeof settings).toBe('object');
});
test('`writeSettings` is a function', () => {
  expect(typeof writeSettings).toBe('function');
});

test('`isURL` is a function', () => {
  expect(typeof isURL).toBe('function');
});
test('`suggestCommands` is a function', () => {
  expect(typeof suggestCommands).toBe('function');
});
test('`onCancel` is a function', () => {
  expect(typeof onCancel).toBe('function');
});
test('`getChoices` is a function', () => {
  expect(typeof getChoices).toBe('function');
});
test('`selectProject` is a function', () => {
  expect(typeof selectProject).toBe('function');
});
test('`selectScript` is a function', () => {
  expect(typeof selectScript).toBe('function');
});
