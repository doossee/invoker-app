import { Zap, Send, Globe, Code2 } from 'lucide-react';

export function WelcomePage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Zap size={32} className="text-accent" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome to Invoker</h2>
        <p className="text-sm text-text-dim mb-8">Select a request from the sidebar to get started.</p>

        <div className="grid gap-3 text-left text-xs">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
            <Send size={16} className="text-accent flex-shrink-0" />
            <div>
              <div className="font-medium text-text-primary">Send Request</div>
              <div className="text-text-muted">Cmd + Enter</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
            <Globe size={16} className="text-green-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-text-primary">Switch Environment</div>
              <div className="text-text-muted">Cmd + E</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
            <Code2 size={16} className="text-purple-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-text-primary">Format JSON</div>
              <div className="text-text-muted">Cmd + Shift + F</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
