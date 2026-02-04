import { useEffect, useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
// import axios from "axios"; 

// Types (should share with backend or define locally)
interface NewsItem {
    id: string;
    headline: string;
    source: string;
    timestamp: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number;
}

export const NewsFeed = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch from our new backend
                const response = await fetch('http://localhost:5001/api/news');
                const data = await response.json();
                setNews(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch news:", err);
                // Fallback to mock if server is down
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground animate-pulse">Loading news stream...</div>;
    }

    return (
        <div className="flex flex-col gap-0 divide-y divide-border/30">
            {news.map((item) => (
                <div key={item.id} className="p-4 hover:bg-secondary/30 transition-colors group flex items-start gap-4">
                    {/* Sentiment Indicator */}
                    <div className={`mt-1.5 min-w-[3px] h-10 rounded-full 
                        ${item.sentiment === 'POSITIVE' ? 'bg-green-500' :
                            item.sentiment === 'NEGATIVE' ? 'bg-red-500' : 'bg-gray-500'}`} />

                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                            <a href="#" className="font-medium text-sm text-foreground/90 hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {item.headline}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="bg-secondary px-1.5 py-0.5 rounded text-foreground/70">{item.source}</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-1.5 rounded font-medium 
                                ${item.sentiment === 'POSITIVE' ? 'text-green-500 bg-green-500/10' :
                                    item.sentiment === 'NEGATIVE' ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-gray-500/10'}`}>
                                {item.sentiment}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
