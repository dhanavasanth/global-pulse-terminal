/**
 * SideMenu Component
 * 
 * A collapsible left-side navigation matching the app's design.
 * Shows navigation links with active state indicators.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FlaskConical,
    Activity,
    Filter,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Settings,
    HelpCircle,
    Bell,
    Globe
} from 'lucide-react';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
}

const navItems: NavItem[] = [
    {
        path: '/',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        path: '/options-lab',
        label: 'Options Lab',
        icon: <FlaskConical className="w-5 h-5" />,
    },
    {
        path: '/order-flow',
        label: 'OrderFlow',
        icon: <Activity className="w-5 h-5" />,
    },
    {
        path: '/market-dashboard',
        label: 'Global Dashboard',
        icon: <Globe className="w-5 h-5" />,
        badge: 'NEW',
        badgeColor: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30'
    },
];

interface SideMenuProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    onOpenScreener?: () => void;
}

export default function SideMenu({ isCollapsed = false, onToggle, onOpenScreener }: SideMenuProps) {
    const location = useLocation();

    return (
        <div
            className={`h-full bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-56'
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 p-4 border-b border-border/30">
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-bullish rounded-full live-pulse" />
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">
                            <span className="text-glow-cyan">Thinn</span>
                            <span className="text-primary">AIQ</span>
                        </h1>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <>
                                    <span className="text-sm font-medium truncate">{item.label}</span>
                                    {item.badge && (
                                        <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}

                {/* Screener Button */}
                <button
                    onClick={onOpenScreener}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-muted-foreground hover:bg-secondary/50 hover:text-foreground group"
                    title={isCollapsed ? 'Stock Screener' : undefined}
                >
                    <Filter className="w-5 h-5 flex-shrink-0 group-hover:text-violet-400" />
                    {!isCollapsed && (
                        <span className="text-sm font-medium">Screener</span>
                    )}
                </button>
            </nav>

            {/* Bottom Actions */}
            <div className="p-2 border-t border-border/30 space-y-1">
                <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                    title={isCollapsed ? 'Notifications' : undefined}
                >
                    <Bell className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm">Alerts</span>}
                </button>
                <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                    title={isCollapsed ? 'Settings' : undefined}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm">Settings</span>}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center p-2 border-t border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
            >
                {isCollapsed ? (
                    <ChevronRight className="w-5 h-5" />
                ) : (
                    <ChevronLeft className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
