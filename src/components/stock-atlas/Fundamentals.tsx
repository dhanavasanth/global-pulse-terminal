
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFundamentalData } from '@/lib/screener-api';

const Fundamentals: React.FC = () => {
    const data = getFundamentalData("TCS"); // Default to TCS or make dynamic later

    return (
        <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Company Fundamentals</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground">Metric</TableHead>
                            <TableHead className="text-right text-muted-foreground">Mar 2024</TableHead>
                            <TableHead className="text-right text-muted-foreground">Mar 2023</TableHead>
                            <TableHead className="text-right text-muted-foreground">Mar 2022</TableHead>
                            <TableHead className="text-right text-muted-foreground">YoY %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={index} className="hover:bg-muted/50 border-border">
                                <TableCell className="font-medium text-foreground">{row.metric}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.mar2024}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.mar2023}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.mar2022}</TableCell>
                                <TableCell className={`text-right font-bold ${row.yoy.startsWith('+') ? 'text-bullish' : 'text-bearish'}`}>
                                    {row.yoy}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Fundamentals;
