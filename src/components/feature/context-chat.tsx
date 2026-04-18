
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { chatWithKook } from '@/ai/flows/kook-genkit-agent';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface ContextChatProps {
  pageContext: string;
  contextData: any;
  placeholder: string;
}

export default function ContextChat({ pageContext, contextData, placeholder }: ContextChatProps) {
  const { user, profile } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'kook' | 'user', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get initial contextual tip from IA
  useEffect(() => {
    const getInitialTip = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await chatWithKook({
          message: `Estou na página do hub ${pageContext}. Analise meus dados recentes e meu objetivo declarado (se houver) neste contexto: ${JSON.stringify(contextData)}. Me dê uma dica carinhosa, curta e sem emojis sobre como manter a coerência hoje.`,
          uid: user.uid,
          aiName: profile?.aiName,
          userNickname: profile?.nickname,
        });
        setMessages([{ role: 'kook', text: response.join(' ') }]);
      } catch (e) {
        setMessages([{ role: 'kook', text: "Oi! Sou o Kook. Como posso ajudar com seu bem-estar hoje?" }]);
      } finally {
        setLoading(false);
      }
    };
    getInitialTip();
  }, [user, pageContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await chatWithKook({
        message: `Contexto: Hub ${pageContext}. Objetivo e Dados: ${JSON.stringify(contextData)}. Pergunta da usuária: ${userText}. Responda considerando se o comportamento real está coerente com o objetivo.`,
        uid: user.uid,
        aiName: profile?.aiName,
        userNickname: profile?.nickname,
      });
      setMessages(prev => [...prev, { role: 'kook', text: response.join(' ') }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'kook', text: "Tive um probleminha aqui. Pode tentar de novo?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="claymorphism bg-card/80 backdrop-blur-sm overflow-hidden border-primary/20">
      <div className="bg-primary/5 p-3 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Kook Inteligência</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Conectado</span>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div ref={scrollRef} className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed", 
                m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/50 text-foreground rounded-tl-none border border-white/5")}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Kook está analisando...
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder={placeholder} 
            className="flex-1 bg-background/50 border-none focus-visible:ring-1 ring-primary/30"
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button size="icon" onClick={handleSend} disabled={loading} className="shrink-0 rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
