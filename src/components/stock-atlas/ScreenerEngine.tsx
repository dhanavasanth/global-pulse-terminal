
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Save } from "lucide-react";

const ScreenerEngine: React.FC = () => {
    const [formula, setFormula] = useState("");

    return (
        <Card className="w-full bg-card/50 backdrop-blur-sm border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold text-primary">Screener Engine</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-zinc-700 text-zinc-400 hover:text-white">
                        <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-black font-semibold">
                        <Play className="w-4 h-4 mr-1" /> Run Screen
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-md border border-zinc-800 bg-black/20">
                    <label className="text-xs font-medium text-zinc-500 mb-2 block">Custom Formula Builder</label>
                    <div className="flex gap-2 mb-3">
                        <Input
                            placeholder="e.g. Sales growth 3Years > 20% AND ROE > 15%"
                            className="bg-background border-zinc-700 font-mono text-sm"
                            value={formula}
                            onChange={(e) => setFormula(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Sales > 100Cr', 'PE < 20', 'Debt/Eq < 1', 'RSI < 30'].map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer hover:bg-zinc-800 border-zinc-700 text-zinc-400"
                                onClick={() => setFormula(prev => prev ? `${prev} AND ${tag}` : tag)}
                            >
                                <Plus className="w-3 h-3 mr-1" /> {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400">Sector</label>
                        <Select>
                            <SelectTrigger className="border-zinc-700 bg-background">
                                <SelectValue placeholder="All Sectors" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="it">IT Services</SelectItem>
                                <SelectItem value="pharma">Pharma</SelectItem>
                                <SelectItem value="banking">Banking</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400">Market Cap</label>
                        <Select>
                            <SelectTrigger className="border-zinc-700 bg-background">
                                <SelectValue placeholder="All Market Caps" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="large">Large Cap</SelectItem>
                                <SelectItem value="mid">Mid Cap</SelectItem>
                                <SelectItem value="small">Small Cap</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ScreenerEngine;
