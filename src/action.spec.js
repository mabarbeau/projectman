const {
  settings,
  writeSettings,
  isURL,
  onCancel,
  getChoices,
  selectProject,
  selectScript,
  addProject,
  removeProject,
  runProjectCommands,
} = require('./action');

test('add a project is defined', () => {
  expect(typeof addProject).toBe('function');
});
test('remove a project is defined', () => {
  expect(typeof removeProject).toBe('function');
});
test('run project commands is defined', () => {
  expect(typeof runProjectCommands).toBe('function');
});
test('`settings` is a object', () => {
  expect(typeof settings).toBe('object');
});
test('`writeSettings` is a function', () => {
  expect(typeof writeSettings).toBe('function');
});
test('`isURL` is a function', () => {
  expect(typeof isURL).toBe('function');
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
