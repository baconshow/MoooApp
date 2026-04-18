"use client";

import { useState, useRef, useCallback } from 'react';
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════
// KOOK CONTEXT CONFIG — saudacoes e chips por hub
// ═══════════════════════════════════════════════════

const KOOK_CONTEXTS: Record<string, { greeting: string; chips: string[] }> = {
  rango: {
    greeting: 'O que voce quer saber sobre a sua refeicao?',
    chips: ['Como estou hoje?', 'O que comer agora?', 'Resumo da semana'],
  },
  vibe: {
    greeting: 'Posso te ajudar a entender seus sintomas.',
    chips: ['Analise minha dor', 'Como dormi?', 'Padrao da semana'],
  },
  grana: {
    greeting: 'Vamos ver como estao suas financas.',
    chips: ['Quanto gastei hoje?', 'Resumo do mes', 'Onde economizar?'],
  },
  home: {
    greeting: 'Como posso te ajudar?',
    chips: ['Como estou?', 'Resumo geral', 'O que fazer agora?'],
  },
};

// ═══════════════════════════════════════════════════
// DRAWER (iOS bottom sheet)
// ═══════════════════════════════════════════════════

function KookDrawer({ visible, onDismiss, context }: {
  visible: boolean; onDismiss: () => void; context: string;
}) {
  const { profile } = useAuth();
  const aiName = profile?.aiName || 'Kook';
  const ctx = KOOK_CONTEXTS[context] || KOOK_CONTEXTS.home;

  const [msg, setMsg] = useState('');
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  const onDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
  }, []);
  const onDragMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) setDragY(diff);
  }, []);
  const onDragEnd = useCallback(() => {
    dragging.current = false;
    if (dragY > 120) onDismiss();
    setDragY(0);
  }, [dragY, onDismiss]);

  if (!visible) return null;

  return (
    <>
      <div onClick={onDismiss} className="fixed inset-0 z-[90] bg-black/50 transition-opacity duration-300" />
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] mx-auto max-w-[420px] bg-background/[0.98] backdrop-blur-xl border-t border-primary/[0.12] rounded-t-[20px]"
        style={{
          transform: `translateY(${Math.max(0, dragY)}px)`,
          transition: dragY === 0 ? 'transform 0.35s cubic-bezier(0.16,1,0.3,1)' : 'none',
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          className="flex justify-center py-2.5 cursor-grab"
          style={{ touchAction: 'none' }}
        >
          <div className="w-9 h-1 rounded-full bg-white/[0.15]" />
        </div>

        <div className="px-4 pb-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground/80">{aiName}</span>
            </div>
            <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors">
              <X className="h-4 w-4 text-muted-foreground/40" />
            </button>
          </div>

          {/* Greeting */}
          <p className="text-sm text-muted-foreground/50 mb-3 leading-relaxed">
            {ctx.greeting}
          </p>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && msg.trim() && setMsg('')}
              placeholder={`Pergunte ao ${aiName}...`}
              className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/30 transition-colors"
            />
            <button className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              msg.trim()
                ? 'bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-white/[0.05]',
            )}>
              <Send className={cn('h-4 w-4', msg.trim() ? 'text-white' : 'text-muted-foreground/30')} />
            </button>
          </div>

          {/* Quick chips */}
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {ctx.chips.map((q, i) => (
              <button key={i} onClick={() => setMsg(q)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium border border-primary/15 bg-primary/[0.05] text-muted-foreground/50 hover:bg-primary/10 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════
// FAB BUTTON + DRAWER WRAPPER
// ═══════════════════════════════════════════════════

export default function KookFab({ context = 'home' }: { context?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-5 z-[80] w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 border border-primary/30 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-[1.08] active:scale-95 transition-transform"
        >
          <MessageCircle className="h-[22px] w-[22px] text-white" />
        </button>
      )}

      {/* Drawer */}
      <KookDrawer visible={open} onDismiss={() => setOpen(false)} context={context} />
    </>
  );
}