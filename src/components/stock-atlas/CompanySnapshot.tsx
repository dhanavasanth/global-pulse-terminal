/**
 * Company Profile - Detailed company information
 */
import React from 'react';
import { Building2, Globe, MapPin, Users, Calendar, ExternalLink, Mail, Phone } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

export default function CompanyProfile() {
    const { profile, isLoading } = useStock();

    if (isLoading && !profile) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Company Profile
                </h3>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-secondary/30 rounded w-3/4" />
                    <div className="h-4 bg-secondary/30 rounded w-full" />
                    <div className="h-4 bg-secondary/30 rounded w-2/3" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Company Profile
                </h3>
                <p className="text-center text-muted-foreground py-4">No profile data available</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Company Profile
            </h3>

            {/* Description */}
            {profile.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                    {profile.description}
                </p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                {profile.ceo && (
                    <InfoItem
                        icon={<Users className="w-4 h-4" />}
                        label="CEO"
                        value={profile.ceo}
                    />
                )}
                {profile.fullTimeEmployees && (
                    <InfoItem
                        icon={<Users className="w-4 h-4" />}
                        label="Employees"
                        value={parseInt(profile.fullTimeEmployees).toLocaleString()}
                    />
                )}
                {profile.sector && (
                    <InfoItem
                        icon={<Building2 className="w-4 h-4" />}
                        label="Sector"
                        value={profile.sector}
                    />
                )}
                {profile.industry && (
                    <InfoItem
                        icon={<Building2 className="w-4 h-4" />}
                        label="Industry"
                        value={profile.industry}
                    />
                )}
                {profile.country && (
                    <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="Location"
                        value={`${profile.city || ''}, ${profile.state || ''} ${profile.country}`}
                    />
                )}
                {profile.ipoDate && (
                    <InfoItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="IPO Date"
                        value={new Date(profile.ipoDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    />
                )}
            </div>

            {/* Website Link */}
            {profile.website && (
                <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <Globe className="w-4 h-4" />
                    {profile.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-secondary/30 rounded-lg p-2.5 border border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                {icon}
                {label}
            </div>
            <div className="text-sm font-medium text-foreground truncate" title={value}>
                {value}
            </div>
        </div>
    );
}
