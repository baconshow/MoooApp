
import { Star, Flower2, Heart, Box, Wind, LucideIcon } from "lucide-react";

export interface MeditationStep {
    id: number;
    text: string;
}

export interface Meditation {
    title: string;
    slug: string;
    duration: string;
    icon: LucideIcon;
    steps: MeditationStep[];
}

export const meditations: Meditation[] = [
    {
        title: "Respiração da Estrelinha Lunar",
        slug: "respiracao-estrelinha-lunar",
        duration: "1 min",
        icon: Star,
        steps: [
            { id: 1, text: "Respira bem fundo pelo nariz..." },
            { id: 2, text: "segura um pouquinho..." },
            { id: 3, text: "agora solta devagar pela boca, como se apagasse uma velinha... 🕯️" },
            { id: 4, text: "De novo... inspira..." },
            { id: 5, text: "segura..." },
            { id: 6, text: "e solta..." },
            { id: 7, text: "Imagina uma estrelinha pousando no seu travesseiro." },
            { id: 8, text: "Ela tá dizendo: ‘tá tudo bem agora, pode descansar’." },
            { id: 9, text: "Você tá segura. Você tá bem. Você merece essa paz." }
        ]
    },
    {
        title: "Meditação do Campo de Margaridas",
        slug: "campo-de-margaridas",
        duration: "2 min",
        icon: Flower2,
        steps: [
            { id: 1, text: "Imagina que você está deitada num campo cheio de flores..." },
            { id: 2, text: "o vento é gostoso, o sol é morninho." },
            { id: 3, text: "Agora respira fundo… 🌼" },
            { id: 4, text: "Inspira contando até 4...\n1... 2... 3... 4" },
            { id: 5, text: "Segura por 2 segundos" },
            { id: 6, text: "Solta em 4..." },
            { id: 7, text: "(repete mais 2x)" },
            { id: 8, text: "Cada flor no campo é uma preocupação indo embora." },
            { id: 9, text: "O Jesse tá ali perto, deitadinho também, só respirando com você." }
        ]
    },
    {
        title: "Abraço de Travesseiro",
        slug: "abraco-de-travesseiro",
        duration: "3 min",
        icon: Heart,
        steps: [
            { id: 1, text: "Deita confortável. Fecha os olhos." },
            { id: 2, text: "Agora se abraça, bem apertadinho. Pode ser um travesseiro também." },
            { id: 3, text: "Inspira por 3..." },
            { id: 4, text: "segura..." },
            { id: 5, text: "solta por 5..." },
            { id: 6, text: "Repete comigo mentalmente:" },
            { id: 7, text: "‘Eu tô aqui. Eu fiz o meu melhor. Agora é hora de descansar.’" },
            { id: 8, text: "Solta os ombros. Solta os dedos. Solta os pensamentos." },
            { id: 9, text: "Tá tudo certo." }
        ]
    },
    {
        title: "Respiração Quadrada (Box Breathing)",
        slug: "respiracao-quadrada",
        duration: "2 min",
        icon: Box,
        steps: [
            { id: 1, text: "Vamos fazer a respiração da caixinha, tá?" },
            { id: 2, text: "Inspira por 4 segundos..." },
            { id: 3, text: "Segura por 4..." },
            { id: 4, text: "Solta por 4..." },
            { id: 5, text: "Espera 4..." },
            { id: 6, text: "(Repete 4x)" },
            { id: 7, text: "Isso ajuda seu cérebro a sair do modo alerta." },
            { id: 8, text: "O Jesse diz: ‘você não tá atrasada, tá cansada. E tá tudo bem descansar.’" }
        ]
    },
    {
        title: "Meditação Anti-Ansiedade Flash",
        slug: "anti-ansiedade-flash",
        duration: "2 min",
        icon: Wind,
        steps: [
            { id: 1, text: "Sente seu corpo no lugar. Respira." },
            { id: 2, text: "Agora olha pra cinco coisas ao seu redor." },
            { id: 3, text: "Pensa em 4 sons que você consegue ouvir." },
            { id: 4, text: "Toca 3 coisas com sua mão." },
            { id: 5, text: "Sente 2 cheiros." },
            { id: 6, text: "E lembra de 1 coisa que te faz sorrir." },
            { id: 7, text: "Tá vendo? Você voltou pro presente. Tá aqui. Tá viva. Tá indo bem." }
        ]
    }
];

    