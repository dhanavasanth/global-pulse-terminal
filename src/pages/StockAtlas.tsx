/**
 * Stock Atlas - Advanced Stock Intelligence Platform
 * Real-time data from Financial Modeling Prep API
 */
import React, { useEffect } from 'react';
import MainLayout from "@/components/MainLayout";
import { StockProvider, useStock } from "@/contexts/StockContext";
import TickerSearch from "@/components/stock-atlas/TickerSearch";
import QuoteHeader from "@/components/stock-atlas/QuoteHeader";
import CompanyProfile from "@/components/stock-atlas/CompanySnapshot";
import KeyMetricsGrid from "@/components/stock-atlas/KeyMetricsGrid";
import FinancialStatements from "@/components/stock-atlas/FinancialStatements";
import EarningsHistory from "@/components/stock-atlas/EarningsHistory";
import InsiderTrading from "@/components/stock-atlas/InsiderTrading";
import InstitutionalOwnership from "@/components/stock-atlas/InstitutionalOwnership";
import SECFilings from "@/components/stock-atlas/SECFilings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3,
    FileText,
    TrendingUp,
    Users,
    Building2,
    PieChart,
    DollarSign
} from "lucide-react";

function StockAtlasContent() {
    const { symbol, setSymbol, isLoading } = useStock();

    // Load default symbol on mount
    useEffect(() => {
        setSymbol('AAPL');
    }, []);

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="flex items-center justify-between gap-4">
                <TickerSearch />
                <div className="text-sm text-muted-foreground">
                    Data from <span className="text-primary font-medium">Financial Modeling Prep</span>
                </div>
            </div>

            {/* Quote Header */}
            <QuoteHeader />

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-muted border border-border flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="overview" className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        Financials
                    </TabsTrigger>
                    <TabsTrigger value="earnings" className="flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4" />
                        Earnings
                    </TabsTrigger>
                    <TabsTrigger value="ownership" className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Ownership
                    </TabsTrigger>
                    <TabsTrigger value="filings" className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        SEC Filings
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <KeyMetricsGrid />
                        </div>
                        <div className="space-y-6">
                            <CompanyProfile />
                        </div>
                    </div>
                </TabsContent>

                {/* Financials Tab */}
                <TabsContent value="financials" className="space-y-6">
                    <FinancialStatements />
                </TabsContent>

                {/* Earnings Tab */}
                <TabsContent value="earnings" className="space-y-6">
                    <EarningsHistory />
                </TabsContent>

                {/* Ownership Tab */}
                <TabsContent value="ownership" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <InsiderTrading />
                        <InstitutionalOwnership />
                    </div>
                </TabsContent>

                {/* Filings Tab */}
                <TabsContent value="filings" className="space-y-6">
                    <SECFilings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const StockAtlas = () => {
    const customHeader = (
        <header className="glass-card border-b border-border px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Stock Atlas</h1>
                    <p className="text-xs text-muted-foreground font-mono">Advanced Stock Intelligence • Real-Time Data</p>
                </div>
            </div>
        </header>
    );

    return (
        <StockProvider>
            <MainLayout header={customHeader}>
                <StockAtlasContent />
            </MainLayout>
        </StockProvider>
    );
};

export default StockAtlas;
