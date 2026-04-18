// src/lib/emotion-data.ts
// Based on Plutchik's Wheel of Emotions, simplified for mobile UX
// Organized by Energy (Alta/Baixa) × Valence (Agradável/Desagradável)

export interface Emotion {
  id: string;
  label: string;
  color: string; // HSL color for the emotion bubble
  quadrant: 'high-pleasant' | 'high-unpleasant' | 'low-pleasant' | 'low-unpleasant';
  description: string; // Brief explanation to help identify
}

export interface EmotionQuadrant {
  id: 'high-pleasant' | 'high-unpleasant' | 'low-pleasant' | 'low-unpleasant';
  label: string;
  color: string; // Representative color for the quadrant
  emotions: Emotion[];
}

export const emotionQuadrants: EmotionQuadrant[] = [
  {
    id: 'high-pleasant',
    label: 'Alta Energia · Agradável',
    color: 'hsl(45, 95%, 55%)', // Yellow/Gold
    emotions: [
      { id: 'alegria', label: 'Alegria', color: 'hsl(45, 95%, 55%)', quadrant: 'high-pleasant', description: 'Feliz e contente' },
      { id: 'entusiasmo', label: 'Entusiasmo', color: 'hsl(40, 90%, 50%)', quadrant: 'high-pleasant', description: 'Empolgada e motivada' },
      { id: 'confianca', label: 'Confiança', color: 'hsl(50, 85%, 52%)', quadrant: 'high-pleasant', description: 'Segura de si' },
      { id: 'extase', label: 'Êxtase', color: 'hsl(35, 95%, 55%)', quadrant: 'high-pleasant', description: 'Extremamente feliz' },
      { id: 'amor', label: 'Amor', color: 'hsl(55, 80%, 50%)', quadrant: 'high-pleasant', description: 'Sentindo amor e conexão' },
      { id: 'otimismo', label: 'Otimismo', color: 'hsl(48, 88%, 58%)', quadrant: 'high-pleasant', description: 'Esperançosa sobre o futuro' },
      { id: 'orgulho', label: 'Orgulho', color: 'hsl(42, 92%, 52%)', quadrant: 'high-pleasant', description: 'Orgulhosa de algo' },
      { id: 'admiracao', label: 'Admiração', color: 'hsl(52, 82%, 54%)', quadrant: 'high-pleasant', description: 'Encantada e impressionada' },
    ]
  },
  {
    id: 'high-unpleasant',
    label: 'Alta Energia · Desagradável',
    color: 'hsl(0, 75%, 55%)', // Red
    emotions: [
      { id: 'raiva', label: 'Raiva', color: 'hsl(0, 75%, 55%)', quadrant: 'high-unpleasant', description: 'Irritada e com raiva' },
      { id: 'ansiedade', label: 'Ansiedade', color: 'hsl(15, 70%, 52%)', quadrant: 'high-unpleasant', description: 'Preocupada e inquieta' },
      { id: 'medo', label: 'Medo', color: 'hsl(350, 65%, 50%)', quadrant: 'high-unpleasant', description: 'Assustada e insegura' },
      { id: 'frustacao', label: 'Frustração', color: 'hsl(5, 72%, 53%)', quadrant: 'high-unpleasant', description: 'Impedida de alcançar algo' },
      { id: 'nojo', label: 'Nojo', color: 'hsl(340, 60%, 48%)', quadrant: 'high-unpleasant', description: 'Repulsa por algo' },
      { id: 'estresse', label: 'Estresse', color: 'hsl(10, 68%, 55%)', quadrant: 'high-unpleasant', description: 'Sobrecarregada' },
      { id: 'ciume', label: 'Ciúme', color: 'hsl(355, 62%, 50%)', quadrant: 'high-unpleasant', description: 'Invejosa ou enciumada' },
      { id: 'panico', label: 'Pânico', color: 'hsl(358, 78%, 52%)', quadrant: 'high-unpleasant', description: 'Terror intenso' },
    ]
  },
  {
    id: 'low-pleasant',
    label: 'Baixa Energia · Agradável',
    color: 'hsl(150, 65%, 45%)', // Green
    emotions: [
      { id: 'calma', label: 'Calma', color: 'hsl(150, 65%, 45%)', quadrant: 'low-pleasant', description: 'Tranquila e em paz' },
      { id: 'serenidade', label: 'Serenidade', color: 'hsl(160, 60%, 42%)', quadrant: 'low-pleasant', description: 'Paz interior profunda' },
      { id: 'gratidao', label: 'Gratidão', color: 'hsl(145, 58%, 48%)', quadrant: 'low-pleasant', description: 'Grata pelo que tem' },
      { id: 'acolhida', label: 'Acolhida', color: 'hsl(155, 62%, 44%)', quadrant: 'low-pleasant', description: 'Aceita e segura' },
      { id: 'satisfacao', label: 'Satisfação', color: 'hsl(140, 55%, 46%)', quadrant: 'low-pleasant', description: 'Contente com o momento' },
      { id: 'conforto', label: 'Conforto', color: 'hsl(165, 50%, 43%)', quadrant: 'low-pleasant', description: 'Confortável e aconchegada' },
      { id: 'alivio', label: 'Alívio', color: 'hsl(148, 56%, 50%)', quadrant: 'low-pleasant', description: 'Aliviada de uma tensão' },
      { id: 'ternura', label: 'Ternura', color: 'hsl(152, 60%, 47%)', quadrant: 'low-pleasant', description: 'Sentindo carinho' },
    ]
  },
  {
    id: 'low-unpleasant',
    label: 'Baixa Energia · Desagradável',
    color: 'hsl(220, 60%, 55%)', // Blue
    emotions: [
      { id: 'tristeza', label: 'Tristeza', color: 'hsl(220, 60%, 55%)', quadrant: 'low-unpleasant', description: 'Triste e melancólica' },
      { id: 'tedio', label: 'Tédio', color: 'hsl(210, 45%, 52%)', quadrant: 'low-unpleasant', description: 'Sem interesse em nada' },
      { id: 'solidao', label: 'Solidão', color: 'hsl(225, 55%, 50%)', quadrant: 'low-unpleasant', description: 'Sentindo-se sozinha' },
      { id: 'desanimo', label: 'Desânimo', color: 'hsl(215, 50%, 48%)', quadrant: 'low-unpleasant', description: 'Sem motivação' },
      { id: 'apatia', label: 'Apatia', color: 'hsl(230, 40%, 53%)', quadrant: 'low-unpleasant', description: 'Indiferente a tudo' },
      { id: 'culpa', label: 'Culpa', color: 'hsl(240, 45%, 50%)', quadrant: 'low-unpleasant', description: 'Sentindo culpa' },
      { id: 'vergonha', label: 'Vergonha', color: 'hsl(235, 48%, 52%)', quadrant: 'low-unpleasant', description: 'Envergonhada' },
      { id: 'exaustao', label: 'Exaustão', color: 'hsl(218, 42%, 49%)', quadrant: 'low-unpleasant', description: 'Completamente esgotada' },
    ]
  },
];

export const contextTags = {
  atividades: [
    'Em casa', 'No trabalho', 'Estudando', 'Comendo', 'Descansando',
    'Exercício', 'Saindo', 'No celular', 'Assistindo',
  ],
  pessoas: [
    'Sozinha', 'Com Jesse', 'Família', 'Amigos', 'Colegas', 'Pets',
  ],
};

export const getAllEmotions = (): Emotion[] => {
  return emotionQuadrants.flatMap(q => q.emotions);
};

export const getEmotionById = (id: string): Emotion | undefined => {
  return getAllEmotions().find(e => e.id === id);
};
