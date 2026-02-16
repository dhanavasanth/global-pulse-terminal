import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FlaskConical,
    Activity,
    Filter,
    ChevronLeft,
    ChevronRight,
    Settings,
    Bell,
    Globe,
    Search,
    LogOut,
    Zap
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import logo from '@/assets/logo.png';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
        path: '/stock-atlas',
        label: 'StockAtlas',
        icon: <Globe className="w-5 h-5" />,
    },
    {
        path: '/screener',
        label: 'Screener',
        icon: <Filter className="w-5 h-5" />,
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
        path: '/autotrade',
        label: 'AutoTrade AI',
        icon: <Zap className="w-5 h-5" />,
    },
    {
        path: '/market-dashboard',
        label: 'Global Dashboard',
        icon: <Globe className="w-5 h-5" />,
    },
    {
        path: '/tasks',
        label: 'Tasks',
        icon: <Activity className="w-5 h-5" />,
    },
    {
        path: '/help',
        label: 'Help',
        icon: <Bell className="w-5 h-5" />,
    },
    {
        path: '/settings',
        label: 'Settings',
        icon: <Settings className="w-5 h-5" />,
    },
];

interface SideMenuProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    onOpenScreener?: () => void;
}

export default function SideMenu({ isCollapsed: propsCollapsed, onToggle: propsOnToggle }: SideMenuProps) {
    const location = useLocation();
    const [localCollapsed, setLocalCollapsed] = useState(false);

    const isControlled = propsCollapsed !== undefined && propsOnToggle !== undefined;
    const isCollapsed = isControlled ? propsCollapsed : localCollapsed;

    const handleToggle = () => {
        if (isControlled) {
            propsOnToggle && propsOnToggle();
        } else {
            setLocalCollapsed(!localCollapsed);
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={`flex flex-col h-screen sticky top-0 bg-background border-r border-border transition-all duration-300 ease-in-out relative flex-shrink-0 z-40 ${isCollapsed ? 'w-20' : 'w-72'
                    }`}
            >
                {/* Logo Section */}
                <div className={`flex items-center gap-3 p-4 h-16 border-b border-border/40 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="relative flex-shrink-0">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-9 h-9 rounded-lg object-cover"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-base font-bold tracking-tight text-foreground whitespace-nowrap">
                                Market Terminal
                            </h1>
                        </div>
                    )}
                </div>



                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 py-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const LinkContent = (
                            <Link
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold'
                                    : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:shadow-sm'
                                    } ${isCollapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : ''}`}
                            >
                                <span className="flex-shrink-0 relative z-10 w-fit h-fit">
                                    {item.icon}
                                </span>
                                {!isCollapsed && (
                                    <span className="text-sm tracking-wide">{item.label}</span>
                                )}
                            </Link>
                        );

                        return isCollapsed ? (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    {LinkContent}
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-foreground text-background font-medium rounded-xl px-4 py-2 ml-2">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div key={item.path}>{LinkContent}</div>
                        );
                    })}


                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom Section: Profile & Toggle */}
                <div className="p-4 space-y-4">

                    {/* User Profile */}
                    <div className={`bg-secondary/30 rounded-3xl p-2 border border-border/30 flex items-center gap-3 ${isCollapsed ? 'justify-center aspect-square' : ''}`}>
                        <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate">John Doe</p>
                                <p className="text-xs text-muted-foreground truncate">Admin</p>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button className="p-2 rounded-xl hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Theme Toggle - Absolute Bottom Left request */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                        <ThemeToggle />
                        {!isCollapsed && (
                            <button
                                onClick={handleToggle}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {isCollapsed && (
                        <button
                            onClick={handleToggle}
                            className="w-full flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors mt-2"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
