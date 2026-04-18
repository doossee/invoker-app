import { useState, useEffect } from 'react';

type AuthType = 'none' | 'bearer' | 'basic';

interface Props {
  auth: string | undefined;
  onChange: (auth: string) => void;
}

function parseAuth(raw: string | undefined): { type: AuthType; token: string; user: string; pass: string } {
  if (!raw || raw === 'none') return { type: 'none', token: '', user: '', pass: '' };
  if (raw.startsWith('bearer ')) return { type: 'bearer', token: raw.slice(7), user: '', pass: '' };
  if (raw.startsWith('basic ')) {
    const rest = raw.slice(6);
    const spaceIdx = rest.indexOf(' ');
    if (spaceIdx >= 0) {
      return { type: 'basic', token: '', user: rest.slice(0, spaceIdx), pass: rest.slice(spaceIdx + 1) };
    }
    return { type: 'basic', token: '', user: rest, pass: '' };
  }
  return { type: 'none', token: '', user: '', pass: '' };
}

export function AuthTab({ auth, onChange }: Props) {
  const parsed = parseAuth(auth);
  const [type, setType] = useState<AuthType>(parsed.type);
  const [token, setToken] = useState(parsed.token);
  const [user, setUser] = useState(parsed.user);
  const [pass, setPass] = useState(parsed.pass);

  // Sync back to parent when local state changes
  useEffect(() => {
    if (type === 'none') {
      onChange('none');
    } else if (type === 'bearer') {
      onChange(`bearer ${token}`);
    } else if (type === 'basic') {
      onChange(`basic ${user} ${pass}`);
    }
  }, [type, token, user, pass, onChange]);

  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="text-xs text-on-surface-variant mb-1 block">Auth Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AuthType)}
          className="bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none cursor-pointer"
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {type === 'bearer' && (
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="{{token}}"
            className="w-full bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none"
          />
        </div>
      )}

      {type === 'basic' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Username</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="username"
              className="w-full bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Password</label>
            <input
              type="text"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="password"
              className="w-full bg-surface-container text-on-surface text-xs font-mono px-2 py-1.5 rounded-md border border-outline-variant focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
