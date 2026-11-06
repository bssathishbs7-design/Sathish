import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Validate credentials without returning their values in diagnostics. */
export function connectionInput(body, current) {
  const key = body.useSavedKey === true ? current.key : body.key?.trim();
  const model = body.model?.trim();
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{20,512}$/.test(key)) throw Error('Enter a valid API key.');
  if (typeof model !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(model)) throw Error('Enter a valid model ID.');
  return { key, model, ready: true };
}

/** Minimal structured response checks access without sending workspace content. */
export async function verifyConnection(config) {
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model, store: false, max_output_tokens: 512,
        input: 'Return ready as true.',
        text: { format: { type: 'json_schema', name: 'connection_check', strict: true,
          schema: { type: 'object', properties: { ready: { type: 'boolean', enum: [true] } }, required: ['ready'], additionalProperties: false } } } })
    });
  } catch { throw Error('Connection timed out or the service could not be reached. Try again.'); }
  if (!response.ok) throw Error(({401:'The API key was not accepted.',403:'This key does not have the required access.',404:'This model was not found or is unavailable to this key.',429:'Rate or usage limit reached. Check your API account and retry.',400:'The model could not complete this connection check. Check the model ID and supported features.'})[response.status] || 'OpenAI is unavailable. Try again shortly.');
  try {
    const result = await response.json();
    const text = result.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
    if (result.status !== 'completed' || JSON.parse(text).ready !== true) throw Error();
  } catch { throw Error('Verification did not complete. Try again or choose another supported model.'); }
}

/** Atomically persist only verified credentials, outside exported workspace data. */
export function saveConnection(root, config) {
  const file = path.join(root, '.env.planning.local');
  const directory = path.join(root, '.product-planning.local');
  const temporary = path.join(directory, `connection-${randomUUID()}.tmp`);
  try {
    if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw Error();
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const lines = existing.split(/\r?\n/).filter(line => !/^\s*(OPENAI_API_KEY|OPENAI_MODEL)\s*=/.test(line));
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(temporary, `${lines.join('\n').trim()}\nOPENAI_API_KEY=${config.key}\nOPENAI_MODEL=${config.model}\n`, { mode: 0o600 });
    fs.renameSync(temporary, file);
  } catch { throw Error('Could not save the connection locally. Your previous configuration is unchanged.'); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
