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
    };

    const handleRemoveAvatar = () => {
        updateProfile({ avatar: undefined });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-lg xs:text-xl font-semibold text-foreground">Profil</h2>
                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                    Zarządzaj swoimi danymi osobowymi i preferencjami
                </p>
            </div>

            <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 xs:gap-6 p-4 xs:p-6 rounded-xl border border-border bg-card">
                <div className="relative group flex-shrink-0">
                    <Avatar className="w-20 h-20 xs:w-24 xs:h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback className="text-xl xs:text-2xl bg-primary/10 text-primary">
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
                        <Camera className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                    </button>
                </div>

                <div className="flex-1 text-center xs:text-left">
                    <h3 className="font-semibold text-base xs:text-lg">{profile.name}</h3>
                    <p className="text-xs xs:text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                        Członek od {new Date(profile.createdAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long'
                    })}
                    </p>

                    <div className="flex gap-2 mt-3 justify-center xs:justify-start">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAvatarChange}
                            className="h-8 xs:h-9 text-xs"
                        >
                            <Camera className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1.5" />
                            <span className="hidden xs:inline">Zmień</span> zdjęcie
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="h-8 xs:h-9 text-xs"
                        >
                            Usuń
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 xs:space-y-6">
                <h3 className="text-[10px] xs:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dane osobowe
                </h3>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 xs:gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-xs xs:text-sm">
                            <User className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Imię i nazwisko
                        </Label>
                        <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => updateProfile({ name: e.target.value })}
                            placeholder="Jan Kowalski"
                            className="h-10 xs:h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-xs xs:text-sm">
                            <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => updateProfile({ email: e.target.value })}
                            placeholder="jan@example.com"
                            className="h-10 xs:h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2 text-xs xs:text-sm">
                            <Building2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Firma (opcjonalnie)
                        </Label>
                        <Input
                            id="company"
                            value={profile.company || ''}
                            onChange={(e) => updateProfile({ company: e.target.value })}
                            placeholder="Nazwa firmy"
                            className="h-10 xs:h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2 text-xs xs:text-sm">
                            <Globe className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Strona WWW
                        </Label>
                        <Input
                            id="website"
                            type="url"
                            value={profile.website || ''}
                            onChange={(e) => updateProfile({ website: e.target.value })}
                            placeholder="https://example.com"
                            className="h-10 xs:h-11"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2 text-xs xs:text-sm">
                        <Pencil className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                        Bio (opcjonalnie)
                    </Label>
                    <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => updateProfile({ bio: e.target.value })}
                        placeholder="Napisz kilka słów o sobie..."
                        rows={3}
                        className="text-sm"
                    />
                    <p className="text-[10px] xs:text-xs text-muted-foreground">
                        {(profile.bio?.length || 0)}/200 znaków
                    </p>
                </div>
            </div>

            <div className="space-y-4 xs:space-y-6">
                <h3 className="text-[10px] xs:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Preferencje regionalne
                </h3>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 xs:gap-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs xs:text-sm">
                            <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Strefa czasowa
                        </Label>
                        <Select
                            value={profile.timezone}
                            onValueChange={(value) => updateProfile({ timezone: value })}
                        >
                            <SelectTrigger className="h-10 xs:h-11">
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

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs xs:text-sm">
                            <Languages className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground" />
                            Język
                        </Label>
                        <Select
                            value={profile.language}
                            onValueChange={(value: 'pl' | 'en') => updateProfile({ language: value })}
                        >
                            <SelectTrigger className="h-10 xs:h-11">
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

            <div className="p-4 xs:p-6 rounded-xl border border-border bg-card">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-medium text-sm xs:text-base">Zmiana hasła</h3>
                        <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                            Zaktualizuj hasło do swojego konta
                        </p>
                    </div>
                    <Button variant="outline" className="w-full xs:w-auto h-9 xs:h-10">
                        Zmień hasło
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}