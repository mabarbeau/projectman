#!/usr/bin/env node

import App from './App';

import os from 'os';
import path from 'path';
import figlet from 'figlet';
import { terminal as term } from "terminal-kit";
import setting from './settings';

term.clear().red(
  `\n${figlet.textSync(' playbook', {
    horizontalLayout: 'default',
    font: 'ANSI Shadow',
  })}\n`,
);

const app = new App({
  setting,
  settingsPath: path.join(os.homedir(), '.playbook', 'settings.js'),
});
