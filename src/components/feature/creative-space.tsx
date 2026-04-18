"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import DrawingCanvas from "./drawing-canvas";

const moodMessages = [
  "Você é capaz de coisas incríveis.",
  "Todo dia é um novo começo.",
  "Acredite na sua mágica interior.",
  "Crie seu próprio sol hoje.",
  "Sua criatividade é um presente.",
  "Abrace a jornada, não apenas o destino."
];

export default function CreativeSpace() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(moodMessages[Math.floor(Math.random() * moodMessages.length)]);
  }, []);

  return (
      <Card className="claymorphism bg-card/80 backdrop-blur-sm">
        <CardContent className="space-y-4 p-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="font-medium text-sm text-foreground">{message}</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Diário Livre</h3>
              <Textarea placeholder="Deixe seus pensamentos fluírem..." className="h-48 bg-background/50" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Tela de Desenho</h3>
              <DrawingCanvas />
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
