const {
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
