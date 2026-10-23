import { portfolio } from '../data/portfolio';
import type { Actions, State, WindowId } from '../state/context';
import { asset, prettyUrl } from '../utils/format';

export interface Line {
  text: string;
  kind?: 'echo' | 'error' | 'accent' | 'dim';
}

export interface CommandContext {
  print: (...lines: (string | Line)[]) => void;
  clear: () => void;
  actions: Actions;
  state: State;
}

interface Command {
  names: string[];
  usage?: string;
  help?: string;
  /** Easter eggs: not listed by `help` and not tab-completed. */
  hidden?: boolean;
  run: (args: string[], ctx: CommandContext) => void;
}

const { profile, projects, contact } = portfolio;

const opener =
  (id: WindowId, message: string): Command['run'] =>
  (_args, { actions, print }) => {
    actions.open(id);
    print({ text: message, kind: 'dim' });
  };

const downloadResume = (lang: string, ctx: CommandContext) => {
  const file = contact.resumes.find((r) => r.lang.toLowerCase() === lang.toLowerCase());
  if (!file) {
    ctx.print({ text: `Usage: cv <${contact.resumes.map((r) => r.lang.toLowerCase()).join('|')}>`, kind: 'error' });
    return;
  }
  const a = document.createElement('a');
  a.href = asset(file.href);
  a.download = file.filename;
  a.click();
  ctx.print(`Downloading ${file.filename}…`);
  ctx.actions.kill({ killer: ctx.state.settings.playerName, weapon: 'sniper', victim: `CV_${file.lang}.pdf`, headshot: true });
};

export const COMMANDS: Command[] = [
  {
    names: ['help', 'cmdlist'],
    help: 'List available commands',
    run: (_args, { print }) =>
      print(
        { text: 'Available commands:', kind: 'accent' },
        ...COMMANDS.filter((c) => !c.hidden).map((c) => `  ${`${c.names[0]} ${c.usage ?? ''}`.padEnd(20)} ${c.help}`),
        { text: 'Some commands are not listed. Old habits from CS might help.', kind: 'dim' },
      ),
  },
  { names: ['about', 'motd'], help: 'About me (message of the day)', run: opener('about', 'Opening MOTD…') },
  {
    names: ['servers', 'projects'],
    help: 'Open the server browser (projects)',
    run: (_args, { actions, print }) => {
      actions.open('projects');
      print(...projects.map((p) => `  ${p.id.padEnd(18)} ${p.name}`), { text: "Type 'connect <id>' to join one.", kind: 'dim' });
    },
  },
  {
    names: ['connect'],
    usage: '<project>',
    help: 'Open a project by id or name',
    run: (args, { actions, print }) => {
      const q = args.join(' ').toLowerCase();
      if (!q) return print({ text: 'Usage: connect <project>', kind: 'error' });
      const project =
        projects.find((p) => p.id === q) ?? projects.find((p) => p.id.includes(q) || p.name.toLowerCase().includes(q));
      if (!project) return print({ text: `Server "${q}" not found. Type 'servers' for the list.`, kind: 'error' });
      print(`Connecting to ${project.name}…`);
      actions.openProject(project.id);
    },
  },
  { names: ['buy', 'skills'], help: 'Open the buy menu (skills)', run: opener('skills', 'Opening buy menu…') },
  {
    names: ['scoreboard', 'experience'],
    help: 'Show the scoreboard (experience)',
    run: opener('scoreboard', 'Opening scoreboard…'),
  },
  {
    names: ['contact', 'options'],
    help: 'Contact details',
    run: (_args, { actions, print }) => {
      actions.open('options');
      print(
        `E-mail   ${contact.email}`,
        ...(contact.github ? [`GitHub   ${prettyUrl(contact.github)}`] : []),
        ...(contact.linkedin ? [`LinkedIn ${prettyUrl(contact.linkedin)}`] : []),
      );
    },
  },
  {
    names: ['cv', 'resume'],
    usage: '[en|fr]',
    help: 'Download my CV, or read it online without a language',
    run: (args, ctx) => {
      if (args[0]) downloadResume(args[0], ctx);
      else ctx.actions.setView('resume');
    },
  },
  {
    names: ['status'],
    help: 'Server status',
    run: (_args, { print, state }) =>
      print(
        `hostname: ${profile.nickname}'s portfolio`,
        'version : 48/1.6 portfolio build',
        `map     : de_career`,
        `location: ${profile.location}`,
        `players : ${projects.length} projects, 1 spectator (${state.settings.playerName})`,
      ),
  },
  {
    names: ['name'],
    usage: '<nickname>',
    help: 'Set your player name',
    run: (args, { actions, print, state }) => {
      const name = args.join(' ').trim().slice(0, 24);
      if (!name) return print(`"name" is "${state.settings.playerName}"`);
      actions.setSettings({ playerName: name });
      print(`${state.settings.playerName} is now known as ${name}`);
    },
  },
  {
    names: ['volume'],
    usage: '<0|1>',
    help: 'Turn UI sounds off or on',
    run: (args, { actions, print, state }) => {
      if (args[0] !== '0' && args[0] !== '1') return print(`"volume" is "${state.settings.sound ? 1 : 0}"`);
      actions.setSettings({ sound: args[0] === '1' });
      print(`Sound ${args[0] === '1' ? 'on' : 'off'}.`);
    },
  },
  {
    names: ['theme'],
    usage: '<classic|dark>',
    help: 'Switch the UI theme',
    run: (args, { actions, print, state }) => {
      if (args[0] !== 'classic' && args[0] !== 'dark') return print(`"theme" is "${state.settings.theme}"`);
      actions.setSettings({ theme: args[0] });
      print(`Theme set to ${args[0]}.`);
    },
  },
  { names: ['echo'], usage: '<text>', help: 'Print text', run: (args, { print }) => print(args.join(' ')) },
  { names: ['clear', 'cls'], help: 'Clear the console', run: (_args, { clear }) => clear() },
  { names: ['quit', 'exit', 'disconnect'], help: 'Leave the server', run: opener('quit', 'Really?') },

  // Easter eggs
  {
    names: ['sv_cheats'],
    hidden: true,
    run: (args, { print }) =>
      print(
        args[0] === '1'
          ? { text: 'sv_cheats changed to "1". Nothing happened: everything here is legit.', kind: 'accent' }
          : '"sv_cheats" is "0"',
      ),
  },
  { names: ['noclip'], hidden: true, run: (_args, { print }) => print('noclip ON. You float through the menu. Nobody notices.') },
  { names: ['god'], hidden: true, run: (_args, { print }) => print('godmode ON. Production incidents still apply.') },
  {
    names: ['impulse'],
    hidden: true,
    run: (args, { actions, print, state }) => {
      if (args[0] !== '101') return print({ text: 'Unknown impulse.', kind: 'error' });
      print({ text: 'You received every item in the buy menu.', kind: 'accent' });
      actions.open('skills');
      actions.kill({ killer: state.settings.playerName, weapon: 'rifle', victim: 'impostor syndrome', headshot: true });
    },
  },
  {
    names: ['kill'],
    hidden: true,
    run: (_args, { actions, print, state }) => {
      print(`${state.settings.playerName} suicided.`);
      actions.kill({ killer: state.settings.playerName, weapon: 'grenade', victim: state.settings.playerName, team: 't' });
    },
  },
  { names: ['rcon_password', 'rcon'], hidden: true, run: (_args, { print }) => print({ text: 'Bad rcon_password. Nice try.', kind: 'error' }) },
  {
    names: ['bind'],
    hidden: true,
    run: (_args, { print }) => print('~ console · B buy menu · hold TAB scoreboard · Esc close window · 1-9 / 0 in menus'),
  },
  {
    names: ['hire', 'hire_me'],
    hidden: true,
    run: (_args, { actions, print, state }) => {
      print({ text: 'Excellent choice. Opening contact details…', kind: 'accent' });
      actions.open('options');
      actions.kill({ killer: state.settings.playerName, weapon: 'sniper', victim: 'hiring process', headshot: true });
    },
  },
];

export function runCommand(input: string, ctx: CommandContext) {
  const [name, ...args] = input.trim().split(/\s+/);
  const command = COMMANDS.find((c) => c.names.includes(name.toLowerCase()));
  if (!command) {
    ctx.print({ text: `Unknown command: ${name}`, kind: 'error' });
    return false;
  }
  command.run(args, ctx);
  return true;
}

/** Visible command names starting with the typed prefix (for Tab completion). */
export function complete(prefix: string) {
  const p = prefix.trim().toLowerCase();
  if (!p || p.includes(' ')) return [];
  return COMMANDS.filter((c) => !c.hidden)
    .flatMap((c) => c.names)
    .filter((n) => n.startsWith(p));
}
