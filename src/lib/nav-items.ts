import {
  Home, Heart, DollarSign, UtensilsCrossed, Moon, HeartPulse,
  Droplets, Calendar, Plus, Clock, HandCoins, Target, Camera,
  ChefHat, BarChart3, LayoutDashboard, Settings
} from "lucide-react";

export const navItems = [
  { href: "/home", icon: Home, label: "Mooo" },
  { href: "/vibe", icon: Heart, label: "Vibe" },
  { href: "/grana", icon: DollarSign, label: "Grana" },
  { href: "/rango", icon: UtensilsCrossed, label: "Rango" },
];

const secondaryNavItems = [
    // Vibe sub-pages
    { href: "/vibe/sono", label: "Soninho", icon: Moon },
    { href: "/vibe/dor", label: "Diário de Dor", icon: HeartPulse },
    { href: "/vibe/privada", label: "Privada", icon: Droplets },
    { href: "/vibe/ciclo", label: "Ciclo", icon: Calendar },
    // Grana sub-pages
    { href: "/grana/adicionar", label: "Nova Transação", icon: Plus },
    { href: "/grana/historico", label: "Histórico", icon: Clock },
    { href: "/grana/emprestimos", label: "Emprestei", icon: HandCoins },
    { href: "/grana/metas", label: "Metas", icon: Target },
    // Rango sub-pages
    { href: "/rango/analisar", label: "Analisar", icon: Camera },
    { href: "/rango/historico", label: "Galeria", icon: Clock },
    { href: "/rango/sugestoes", label: "Sugestões", icon: ChefHat },
    { href: "/rango/insights", label: "Insights", icon: BarChart3 },
    // Global
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Configurações", icon: Settings },
];

export const getActiveNavItem = (pathname: string) => {
    if (pathname === "/" || pathname === "/home") {
        return navItems.find((item) => item.href === "/home");
    }
    const allNavItems = [...navItems, ...secondaryNavItems];
    // Sort by length descending to match deepest route first
    const sortedItems = allNavItems.sort((a, b) => b.href.length - a.href.length);
    const activeItem = sortedItems.find((item) => item.href !== "/home" && pathname.startsWith(item.href));
    return activeItem || navItems.find((item) => item.href === "/home");
};
