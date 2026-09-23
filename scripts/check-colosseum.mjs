// Read-only authentication check. Never print the PAT or the response body.
const token = process.env.COLOSSEUM_COPILOT_PAT;
const base = process.env.COLOSSEUM_COPILOT_API_BASE || 'https://copilot.colosseum.com/api/v1';
if (!token || token === 'YOUR_PAT') {
  console.error('Configure COLOSSEUM_COPILOT_PAT in your private environment first.');
  process.exit(1);
}
if (base.replace(/\/$/, '') !== 'https://copilot.colosseum.com/api/v1') {
  console.error('Refusing to send the token outside the official Copilot API.');
  process.exit(1);
}
try {
  const response = await fetch(`${base.replace(/\/$/, '')}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'error', signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Authentication check returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.authenticated !== true) throw new Error('Copilot did not confirm authentication');
  console.log('Colosseum Copilot authentication verified.');
} catch (error) {
  // Network exception details may contain request data; keep output minimal.
  console.error('Copilot connection could not be verified. Check the PAT, expiry and network access.');
  process.exitCode = 1;
}
