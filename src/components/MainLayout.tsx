import React, { ReactNode } from 'react';
import Header from "@/components/Header";
import SideMenu from "@/components/SideMenu";

interface MainLayoutProps {
    children: ReactNode;
    className?: string;
    header?: ReactNode;
    showTicker?: boolean; // Reserved for future standard ticker integration if needed
}

const MainLayout = ({ children, className = "", header }: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
            {/* Sidebar - Always on the left, full height */}
            <SideMenu />

            {/* Main Content Area - Flex column to stack Header and Page Content */}
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className}`}>
                {/* Header Section */}
                {header ? header : <Header />}

                {/* Page Content - Scrollable */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
