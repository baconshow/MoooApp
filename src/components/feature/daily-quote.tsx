
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Heart, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const allQuotes = [
    { id: '1', quote: 'Não sabe se entra na faculdade? Deixe o curso entrar no seu coração primeiro.' },
    { id: '2', quote: 'Mooo, a vida te testa, mas nunca te vence.' },
    { id: '3', quote: 'Hoje, respira fundo. E se não der pra lembrar, inventa.' },
    { id: '4', quote: 'Mooo, você é um capítulo lindo mesmo quando acha que esqueceu as falas.' },
    { id: '5', quote: 'Jesse sempre acredita em você, mesmo quando você duvida.' },
    { id: '6', quote: 'Esqueceu de comer? Então prepara, porque a linguiça do Jesse está te esperando em casa.' },
    { id: '7', quote: 'Mooo, você é mais profunda que as falas de dorama sobre amor e destino.' },
    { id: '8', quote: 'Mooo, seu superpoder é ser vulnerável e forte ao mesmo tempo.' },
    { id: '9', quote: 'Se a Dory encontrou o Nemo que era quase impossível, você vai encontrar tudo que procura.' },
    { id: '10', quote: 'Mooo, seus esquecimentos fazem parte da sua história. E eu amo cada um deles.' },
    { id: '11', quote: 'Mooo, você não precisa lembrar o caminho todo. Só de onde veio: do amor.' },
    { id: '12', quote: 'Mooo, sua dor não te define. Sua coragem em como enfrentar a vida, sim!' },
    { id: '13', quote: 'Com ou sem mate, com ou sem sono: você é minha linda.' },
    { id: '14', quote: 'Se fosse fácil, não seria tão incrível ser você.' },
    { id: '15', quote: 'Jesse + Mooo = casal principal de dorama de sucesso.' },
    { id: '16', quote: 'O Jesse fala que vai te responder depois, porque ele sabe que você vai esquecer de perguntar de novo' },
    { id: '17', quote: 'Mooo, seu futuro filho vai se orgulhar da mãe que você já é.' },
    { id: '18', quote: 'Dois úteros, um coração de mãe imenso e uma pitada de safadeza.. uau.' },
    { id: '19', quote: 'Hoje pode doer mas amanhã, você dança K-pop sorrindo.' },
    { id: '20', quote: 'Mooo, você é tipo dorama com final feliz que ninguém espera.' },
];

interface QuoteData {
  id: string;
  quote: string;
}

const SHOWN_CARDS_LIMIT = 6;

const shuffle = (array: QuoteData[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[arr[j]]] = [arr[arr[j]], arr[i]];
    }
    return arr;
};

export default function DailyQuote() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [visibleQuotes, setVisibleQuotes] = useState<QuoteData[]>([]);
  const [availableQuotes, setAvailableQuotes] = useState<QuoteData[]>([]);
  const [usedQuotes, setUsedQuotes] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  
  // Load data from Firestore
  useEffect(() => {
    if (!user) return;

    const loadQuoteData = async () => {
      setLoading(true);
      try {
        // 1. Load Used Quotes from Firestore
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'quotes');
        const settingsSnap = await getDoc(settingsRef);
        const used = settingsSnap.exists() ? new Set<string>(settingsSnap.data().usedIds || []) : new Set<string>();
        
        // 2. Load Favorites from Firestore
        const favsRef = doc(db, 'users', user.uid, 'settings', 'favorites');
        const favsSnap = await getDoc(favsRef);
        const favs = favsSnap.exists() ? new Set<string>(favsSnap.data().quoteIds || []) : new Set<string>();

        let remainingQuotes = allQuotes.filter(q => !used.has(q.id));
        if (remainingQuotes.length === 0) {
            remainingQuotes = [...allQuotes];
            await setDoc(settingsRef, { usedIds: [] }, { merge: true });
            used.clear();
        }
        
        setUsedQuotes(used);
        setFavorites(favs);
        setAvailableQuotes(shuffle(remainingQuotes));
      } catch (e) {
        console.error("Error loading quote data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, [user]);

  useEffect(() => {
    if (!loading && availableQuotes.length > 0 && visibleQuotes.length < SHOWN_CARDS_LIMIT) {
        const needed = SHOWN_CARDS_LIMIT - visibleQuotes.length;
        const newCards = availableQuotes.slice(0, needed);
        setVisibleQuotes(prev => [...newCards, ...prev]);
        setAvailableQuotes(prev => prev.slice(needed));
    }
  }, [loading, availableQuotes, visibleQuotes]);

  const handleShare = (quote: string) => {
    navigator.clipboard.writeText(`"${quote}" - via MoooApp`);
    toast({ title: "Copiado para a área de transferência!" });
  };

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    const isFav = favorites.has(id);
    const newFavs = new Set(favorites);
    if (isFav) newFavs.delete(id); else newFavs.add(id);
    setFavorites(newFavs);

    try {
        const favsRef = doc(db, 'users', user.uid, 'settings', 'favorites');
        await setDoc(favsRef, { quoteIds: Array.from(newFavs) }, { merge: true });
    } catch (e) {
        console.error("Error saving favorite:", e);
    }
  };
  
  const handleSwipe = useCallback(async () => {
    const swipedQuote = visibleQuotes[visibleQuotes.length - 1];
    if (!swipedQuote || !user) return;

    const newUsedSet = new Set(usedQuotes).add(swipedQuote.id);
    setUsedQuotes(newUsedSet);

    try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'quotes');
        await setDoc(settingsRef, { usedIds: Array.from(newUsedSet) }, { merge: true });
    } catch (e) {
        console.error("Error saving used quotes:", e);
    }

    let nextAvailable = availableQuotes;
    if (nextAvailable.length === 0) {
        nextAvailable = shuffle(allQuotes.filter(q => q.id !== swipedQuote.id));
    }
    
    const nextQuote = nextAvailable[0];
    setVisibleQuotes(prev => {
        const newVisible = prev.slice(0, prev.length - 1);
        return nextQuote ? [nextQuote, ...newVisible] : newVisible;
    });
    setAvailableQuotes(prev => prev.slice(1));
    currentX.current = 0;
  }, [visibleQuotes, availableQuotes, usedQuotes, user]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const topCard = cardRefs.current[visibleQuotes.length - 1];
    if (!topCard) return;
    isDragging.current = true;
    startX.current = e.clientX;
    topCard.style.transition = 'none';
    topCard.setPointerCapture(e.pointerId);
  }, [visibleQuotes.length]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const topCard = cardRefs.current[visibleQuotes.length - 1];
    if (!topCard) return;
    currentX.current = e.clientX - startX.current;
    const rotation = currentX.current / 20;
    topCard.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`;
  }, [visibleQuotes.length]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const topCard = cardRefs.current[visibleQuotes.length - 1];
    if (!topCard) return;
    topCard.releasePointerCapture(e.pointerId);
    isDragging.current = false;
    topCard.style.transition = 'transform 0.3s ease-out';
    if (Math.abs(currentX.current) > 100) {
      const direction = Math.sign(currentX.current);
      topCard.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`;
      setTimeout(handleSwipe, 200);
    } else {
      topCard.style.transform = 'translateX(0px) rotate(0deg)';
    }
  }, [visibleQuotes.length, handleSwipe]);

  if (loading) return <Skeleton className="h-[250px] w-full rounded-2xl" />;

  if (visibleQuotes.length === 0) {
    return (
      <Card className="h-[250px] flex flex-col items-center justify-center text-center claymorphism bg-card/80 p-6">
        <p className="text-muted-foreground mb-4">Você viu todas as citações!</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative h-[250px] w-full flex items-center justify-center">
      {visibleQuotes.map((quoteData, index) => {
        const isTopCard = index === visibleQuotes.length - 1;
        const scale = 1 - (visibleQuotes.length - 1 - index) * 0.05;
        const translateY = -(visibleQuotes.length - 1 - index) * 10;
        
        return (
          <Card
            key={quoteData.id}
            ref={el => cardRefs.current[index] = el}
            className={cn(
              "claymorphism bg-card/80 backdrop-blur-sm overflow-hidden h-full flex flex-col absolute w-full transition-all",
              isTopCard ? "cursor-grab touch-none" : "touch-none",
              !isTopCard && "duration-300 ease-in-out"
            )}
            style={{
                zIndex: index,
                transform: isTopCard ? `translateX(${currentX.current}px) rotate(${currentX.current / 20}deg)` : `scale(${scale}) translateY(${translateY}px)`
            }}
            onPointerDown={isTopCard ? onPointerDown : undefined}
            onPointerMove={isTopCard ? onPointerMove : undefined}
            onPointerUp={isTopCard ? onPointerUp : undefined}
            onPointerCancel={isTopCard ? onPointerUp : undefined}
          >
             <CardContent className="flex-grow flex items-center justify-center text-center p-8">
                <p className="text-xl font-medium text-foreground leading-relaxed italic">
                    &ldquo;{quoteData.quote}&rdquo;
                </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 bg-black/5">
                <Button variant="ghost" size="icon" onClick={() => toggleFavorite(quoteData.id)} className="rounded-full">
                    <Heart className={cn("h-5 w-5", favorites.has(quoteData.id) && "text-red-500 fill-current")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShare(quoteData.quote)} className="rounded-full">
                    <Share2 className="h-5 w-5" />
                </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
