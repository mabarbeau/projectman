const {
  addProject,
  removeProject,
  getProjectPath,
  runProjectCommands,
} = require('./action');

test('add a project is defined', () => {
  expect(typeof addProject).toBe('function');
});
test('remove a project is defined', () => {
  expect(typeof removeProject).toBe('function');
});
test('get project path is defined', () => {
  expect(typeof getProjectPath).toBe('function');
});
test('run project commands is defined', () => {
  expect(typeof runProjectCommands).toBe('function');
});
