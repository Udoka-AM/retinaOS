type Fields = Record<string, unknown>;

function line(level: string, msg: string, fields?: Fields) {
  console.log(JSON.stringify({ level, msg, ts: new Date().toISOString(), ...fields }));
}

export const log = {
  info: (msg: string, fields?: Fields) => line("info", msg, fields),
  warn: (msg: string, fields?: Fields) => line("warn", msg, fields),
  error: (msg: string, fields?: Fields) => line("error", msg, fields),
};
