#!/usr/bin/env node
import App from './App';

const os = require('os');
const path = require('path');
const figlet = require('figlet');
const term = require('terminal-kit').terminal;

term.clear();

term.red(
  `\n${figlet.textSync(' ProjectMan', {
    horizontalLayout: 'default',
    font: 'ANSI Shadow',
  })}\n`,
);

// eslint-disable-next-line no-unused-vars
const app = new App({
  settingsPath: path.join(os.homedir(), '.projectman', 'settings.js'),
});
