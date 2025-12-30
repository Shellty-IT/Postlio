// src/components/settings/profile-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Building2,
    Globe,
    Clock,
    Languages,
    Camera,
    Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/store/settings-store';
import { TIMEZONE_OPTIONS, LANGUAGE_OPTIONS } from '@/types/settings';

export function ProfileSection() {
    const { settings, updateProfile } = useSettingsStore();
    const { profile } = settings;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleAvatarChange = () => {
        // TODO: Implement avatar upload modal
        console.log('Avatar change clicked');
    };

    const handleRemoveAvatar = () => {
        updateProfile({ avatar: undefined });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Profil</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Zarządzaj swoimi danymi osobowymi i preferencjami konta
                </p>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-6 p-6 rounded-xl border border-border bg-card">
                <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {getInitials(profile.name)}
                        </AvatarFallback>
                    </Avatar>

                    <button
                        onClick={handleAvatarChange}
                        className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            "bg-black/50 rounded-full opacity-0 group-hover:opacity-100",
                            "transition-opacity"
                        )}
                    >
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Członek od {new Date(profile.createdAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long'
                    })}
                    </p>

                    <div className="flex gap-2 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAvatarChange}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Zmień zdjęcie
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                        >
                            Usuń zdjęcie
                        </Button>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Dane osobowe
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            Imię i nazwisko
                        </Label>
                        <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => updateProfile({ name: e.target.value })}
                            placeholder="Jan Kowalski"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => updateProfile({ email: e.target.value })}
                            placeholder="jan@example.com"
                        />
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            Firma (opcjonalnie)
                        </Label>
                        <Input
                            id="company"
                            value={profile.company || ''}
                            onChange={(e) => updateProfile({ company: e.target.value })}
                            placeholder="Nazwa firmy"
                        />
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            Strona WWW (opcjonalnie)
                        </Label>
                        <Input
                            id="website"
                            type="url"
                            value={profile.website || ''}
                            onChange={(e) => updateProfile({ website: e.target.value })}
                            placeholder="https://example.com"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                        Bio (opcjonalnie)
                    </Label>
                    <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => updateProfile({ bio: e.target.value })}
                        placeholder="Napisz kilka słów o sobie..."
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(profile.bio?.length || 0)}/200 znaków
                    </p>
                </div>
            </div>

            {/* Preferences */}
            <div className="space-y-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Preferencje regionalne
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            Strefa czasowa
                        </Label>
                        <Select
                            value={profile.timezone}
                            onValueChange={(value) => updateProfile({ timezone: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz strefę czasową" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONE_OPTIONS.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-muted-foreground" />
                            Język
                        </Label>
                        <Select
                            value={profile.language}
                            onValueChange={(value: 'pl' | 'en') => updateProfile({ language: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz język" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Password Change */}
            <div className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Zmiana hasła</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Zaktualizuj hasło do swojego konta
                        </p>
                    </div>
                    <Button variant="outline">
                        Zmień hasło
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}