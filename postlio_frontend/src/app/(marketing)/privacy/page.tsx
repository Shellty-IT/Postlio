// src/app/(marketing)/privacy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/app-logo';

export const metadata: Metadata = {
    title: 'Polityka prywatności',
    description: 'Polityka prywatności Postlio — jakie dane zbieramy, w jakim celu i jakie masz prawa zgodnie z RODO.',
};

const LAST_UPDATED = '20 lipca 2026';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">{title}</h2>
            <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {children}
            </div>
        </section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Powrót
                            </Button>
                        </Link>
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogo className="h-8 w-8" />
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-12 sm:py-16 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Polityka prywatności</h1>
                <p className="text-sm text-muted-foreground mb-12">Ostatnia aktualizacja: {LAST_UPDATED}</p>

                <div className="space-y-12">
                    <Section id="administrator" title="1. Kto administruje Twoimi danymi">
                        <p>
                            Administratorem danych osobowych zbieranych w aplikacji Postlio jest:
                        </p>
                        <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5 not-prose">
                            <p className="text-foreground font-medium">Shellty IT Tomasz Skorupski</p>
                            <p>NIP: 851-330-70-50</p>
                            <p>Warzymice, Polska</p>
                            <p>
                                E-mail:{' '}
                                <a href="mailto:shellty@zohomail.eu" className="text-primary hover:underline">
                                    shellty@zohomail.eu
                                </a>
                            </p>
                        </div>
                        <p>
                            W sprawach dotyczących Twoich danych osobowych — w tym realizacji praw opisanych w sekcji 9 —
                            możesz kontaktować się bezpośrednio pod powyższym adresem e-mail.
                        </p>
                    </Section>

                    <Section id="zakres-danych" title="2. Jakie dane zbieramy">
                        <p>W zależności od tego, jak korzystasz z Postlio, przetwarzamy:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-foreground">Dane konta:</strong> adres e-mail, hasło (przechowywane
                                wyłącznie jako hash bcrypt — nigdy w postaci jawnej), imię i nazwisko, jeśli je podasz.
                            </li>
                            <li>
                                <strong className="text-foreground">Dane logowania społecznościowego:</strong> jeśli
                                logujesz się przez Google lub Facebook, otrzymujemy od tych dostawców Twój adres e-mail,
                                imię i nazwisko oraz zdjęcie profilowe.
                            </li>
                            <li>
                                <strong className="text-foreground">Dane kont social media podłączonych do publikacji:</strong>{' '}
                                przy łączeniu konta Facebook, Instagram lub LinkedIn otrzymujemy tokeny dostępu (access
                                tokens) niezbędne do publikowania treści w Twoim imieniu, podstawowe dane profilu oraz —
                                dla kont firmowych — informacje o Twoich Stronach/organizacjach. Tokeny przechowujemy w
                                formie zaszyfrowanej (szyfrowanie symetryczne Fernet) i nigdy nie są widoczne w postaci
                                jawnej, nawet dla nas.
                            </li>
                            <li>
                                <strong className="text-foreground">Dane marki:</strong> nazwa, branża, grupa docelowa,
                                profil głosu marki (Voice DNA), kolory, logo — jeśli je skonfigurujesz.
                            </li>
                            <li>
                                <strong className="text-foreground">Treści:</strong> teksty, obrazy i harmonogramy postów,
                                które tworzysz samodzielnie lub generujesz przy pomocy AI.
                            </li>
                            <li>
                                <strong className="text-foreground">Dane techniczne:</strong> adres IP, typ przeglądarki i
                                podstawowe logi serwera — wykorzystywane wyłącznie do zapewnienia bezpieczeństwa
                                (np. ograniczanie liczby żądań) i diagnostyki błędów.
                            </li>
                        </ul>
                    </Section>

                    <Section id="cele-i-podstawy" title="3. Cele przetwarzania i podstawa prawna">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-foreground">Świadczenie usługi</strong> (założenie i obsługa
                                konta, generowanie i publikacja treści) — art. 6 ust. 1 lit. b RODO (wykonanie umowy,
                                której jesteś stroną).
                            </li>
                            <li>
                                <strong className="text-foreground">Publikacja w Twoim imieniu na Facebooku, Instagramie
                                i LinkedIn</strong> — na podstawie Twojej zgody wyrażonej w procesie OAuth przy
                                łączeniu konta (art. 6 ust. 1 lit. a i b RODO).
                            </li>
                            <li>
                                <strong className="text-foreground">Bezpieczeństwo i zapobieganie nadużyciom</strong>{' '}
                                (limity zapytań, wykrywanie błędów) — art. 6 ust. 1 lit. f RODO (nasz prawnie
                                uzasadniony interes).
                            </li>
                            <li>
                                <strong className="text-foreground">Obowiązki prawne</strong> (np. rozliczenia
                                księgowe) — art. 6 ust. 1 lit. c RODO.
                            </li>
                        </ul>
                    </Section>

                    <Section id="ai" title="4. Jak wykorzystujemy sztuczną inteligencję">
                        <p>
                            Treści tekstowe, graficzne i wideo generujemy przy pomocy zewnętrznych modeli AI. Do
                            wygenerowania treści przekazujemy dostawcy modelu wyłącznie polecenie (prompt) oraz — jeśli
                            dotyczy — ustawienia głosu marki potrzebne do dopasowania stylu. Nie przekazujemy dostawcom AI
                            Twojego adresu e-mail, haseł ani tokenów dostępu do kont social media.
                        </p>
                        <p>Aktualnie korzystamy z:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Google Gemini oraz Groq (generowanie i ulepszanie tekstu),</li>
                            <li>Pollinations oraz HuggingFace (generowanie obrazów i wideo).</li>
                        </ul>
                        <p>
                            Wygenerowane obrazy zapisujemy trwale w naszym magazynie plików (Cloudflare R2), aby mogły
                            zostać opublikowane i pozostać dostępne w Twoich zapisanych postach. Obrazy wygenerowane, ale
                            nigdy niezapisane jako część posta, są automatycznie usuwane w ramach cotygodniowego
                            porządkowania (nie wcześniej niż 24 godziny od wygenerowania).
                        </p>
                    </Section>

                    <Section id="odbiorcy" title="5. Komu przekazujemy dane">
                        <p>
                            Nie sprzedajemy Twoich danych. Korzystamy z zewnętrznych dostawców usług (podmiotów
                            przetwarzających), którzy pomagają nam prowadzić Postlio:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 text-foreground">
                                        <th className="py-2 pr-4 font-semibold">Dostawca</th>
                                        <th className="py-2 pr-4 font-semibold">Rola</th>
                                        <th className="py-2 font-semibold">Lokalizacja danych</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    <tr>
                                        <td className="py-2 pr-4">Neon</td>
                                        <td className="py-2 pr-4">Baza danych aplikacji</td>
                                        <td className="py-2">Unia Europejska (Frankfurt)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Render</td>
                                        <td className="py-2 pr-4">Hosting serwera backend</td>
                                        <td className="py-2">USA</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Netlify</td>
                                        <td className="py-2 pr-4">Hosting aplikacji (frontend)</td>
                                        <td className="py-2">USA / globalna sieć CDN</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Cloudflare</td>
                                        <td className="py-2 pr-4">Magazyn wygenerowanych obrazów</td>
                                        <td className="py-2">Unia Europejska</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Google (Gemini, logowanie)</td>
                                        <td className="py-2 pr-4">Generowanie tekstu, logowanie</td>
                                        <td className="py-2">USA</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Groq</td>
                                        <td className="py-2 pr-4">Generowanie tekstu (zapasowo)</td>
                                        <td className="py-2">USA</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Pollinations, HuggingFace</td>
                                        <td className="py-2 pr-4">Generowanie obrazów i wideo</td>
                                        <td className="py-2">USA / UE</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Meta (Facebook, Instagram)</td>
                                        <td className="py-2 pr-4">Publikacja treści na Twoje żądanie</td>
                                        <td className="py-2">Irlandia / USA</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">LinkedIn (Microsoft)</td>
                                        <td className="py-2 pr-4">Publikacja treści na Twoje żądanie</td>
                                        <td className="py-2">Irlandia / USA</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p>
                            Część dostawców przetwarza dane poza Europejskim Obszarem Gospodarczym (głównie w USA). W
                            takich przypadkach opieramy transfer na standardowych klauzulach umownych (SCC) lub innych
                            mechanizmach przewidzianych w RODO, stosowanych przez tych dostawców.
                        </p>
                    </Section>

                    <Section id="okres-przechowywania" title="6. Jak długo przechowujemy dane">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Dane konta — przez cały okres jego istnienia, do momentu żądania usunięcia.</li>
                            <li>
                                Tokeny dostępu do kont social media — do czasu rozłączenia konta w ustawieniach
                                aplikacji lub cofnięcia zgody bezpośrednio u dostawcy (Meta, LinkedIn, Google).
                            </li>
                            <li>
                                Wygenerowane obrazy niezwiązane z żadnym zapisanym postem — maksymalnie kilka dni
                                (automatyczne, cotygodniowe porządkowanie).
                            </li>
                            <li>Kopie zapasowe bazy danych — zgodnie z cyklem rotacji stosowanym przez dostawcę bazy danych.</li>
                        </ul>
                    </Section>

                    <Section id="cookies" title="7. Cookies i przechowywanie lokalne">
                        <p>
                            Postlio nie używa plików cookies do celów reklamowych ani śledzenia w innych serwisach. W
                            przeglądarce, w pamięci lokalnej (local storage), zapisujemy wyłącznie informacje niezbędne
                            do działania aplikacji: podstawowe dane Twojego profilu, listę podłączonych kont social
                            media (bez tokenów) oraz status procesu wdrożenia. Tokeny sesji (dostępu do konta)
                            przechowywane są wyłącznie w pamięci przeglądarki na czas trwania sesji i nie trafiają do
                            local storage.
                        </p>
                    </Section>

                    <Section id="bezpieczenstwo" title="8. Jak zabezpieczamy dane">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Hasła przechowywane wyłącznie jako hash (bcrypt).</li>
                            <li>Tokeny dostępu do kont social media szyfrowane symetrycznie (Fernet) w bazie danych.</li>
                            <li>Cała komunikacja z aplikacją odbywa się przez połączenie szyfrowane (HTTPS).</li>
                            <li>Dostęp do bazy danych i infrastruktury ograniczony do niezbędnego minimum.</li>
                        </ul>
                    </Section>

                    <Section id="prawa" title="9. Twoje prawa">
                        <p>Zgodnie z RODO przysługuje Ci prawo do:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>dostępu do swoich danych i uzyskania ich kopii,</li>
                            <li>sprostowania nieprawidłowych danych,</li>
                            <li>
                                usunięcia danych („prawo do bycia zapomnianym”) — obecnie realizowane na Twoje żądanie
                                przesłane na adres{' '}
                                <a href="mailto:shellty@zohomail.eu" className="text-primary hover:underline">
                                    shellty@zohomail.eu
                                </a>{' '}
                                (samoobsługowe usuwanie konta z poziomu aplikacji jest w przygotowaniu),
                            </li>
                            <li>ograniczenia przetwarzania,</li>
                            <li>przenoszenia danych do innego administratora,</li>
                            <li>wniesienia sprzeciwu wobec przetwarzania opartego na naszym prawnie uzasadnionym interesie,</li>
                            <li>cofnięcia zgody w dowolnym momencie — bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem,</li>
                            <li>
                                wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2,
                                00-193 Warszawa.
                            </li>
                        </ul>
                        <p>
                            Cofnięcie dostępu do konta Facebook, Instagram lub LinkedIn możesz też wykonać bezpośrednio
                            w ustawieniach prywatności danej platformy — to natychmiast unieważnia token, z którego
                            korzysta Postlio.
                        </p>
                    </Section>

                    <Section id="dzieci" title="10. Dzieci">
                        <p>
                            Postlio nie jest kierowane do osób poniżej 16. roku życia i nie zbieramy świadomie danych
                            takich osób. Jeśli dowiemy się, że doszło do zebrania danych osoby poniżej tego wieku bez
                            wymaganej zgody opiekuna, dane te zostaną usunięte.
                        </p>
                    </Section>

                    <Section id="zmiany" title="11. Zmiany polityki prywatności">
                        <p>
                            Możemy aktualizować tę politykę, m.in. wraz z rozwojem aplikacji lub zmianą przepisów. O
                            istotnych zmianach poinformujemy w aplikacji lub e-mailem. Data ostatniej aktualizacji
                            znajduje się na początku tego dokumentu.
                        </p>
                    </Section>

                    <Section id="kontakt" title="12. Kontakt">
                        <p>
                            W sprawach związanych z ochroną danych osobowych napisz do nas na adres{' '}
                            <a href="mailto:shellty@zohomail.eu" className="text-primary hover:underline">
                                shellty@zohomail.eu
                            </a>
                            .
                        </p>
                    </Section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 mt-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <AppLogo className="h-8 w-8" />
                            <span className="font-bold text-xl">Postlio</span>
                        </div>

                        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                Polityka prywatności
                            </Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                Regulamin
                            </Link>
                        </nav>

                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Shellty IT Tomasz Skorupski. Wszelkie prawa zastrzeżone.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
