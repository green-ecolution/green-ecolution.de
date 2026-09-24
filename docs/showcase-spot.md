# Der 30-Sekunden-Spot

Für eine Werbewand gibt es eine eigene, kurze Fassung der Messetafel. Sie liegt
unter `/de/showcase/spot`, läuft genau dreißig Sekunden, spielt einmal und
bleibt danach auf der Schlusskarte stehen. Der Schnitt entsteht nicht von Hand,
sondern wird aufgenommen: Der Browser kann kein Video exportieren, also wird die
Seite auf einem virtuellen Bildschirm abgefilmt.

## Rendern

```bash
pnpm showcase:clips   # holt die Screencasts, falls sie fehlen
pnpm showcase:build   # baut dist/ mit lokalen Clips
nix shell nixpkgs#xvfb nixpkgs#ffmpeg-full nixpkgs#chromium -c pnpm showcase:spot
```

Das Ergebnis liegt unter `out/spot/green-ecolution-spot-30s-de.mp4`, 1920 × 1080 bei
60 Bildern pro Sekunde, H.264 ohne Tonspur. `out/` ist nicht im Git, die fertige
Datei gehört in den Bucket zu den übrigen Videos.

Das normale `ffmpeg` aus nixpkgs bringt kein x11grab mit und kann keinen
Bildschirm aufnehmen, deshalb `ffmpeg-full`. Das Skript prüft das vorher und
sagt es, statt mitten in der Aufnahme auszusteigen.

Optionen: `--lang en` für die englische Fassung, `--fps 30`, wenn der Betreiber
der Wand das verlangt, `--keep-raw` für die verlustarme Rohaufnahme.

## Wie der Schnitt entsteht

Die Seite hält ihr erstes Bild an, bis das Skript sie freigibt, und hält am Ende
das letzte. Dafür steht nicht nur die Uhr der Schleife still, sondern auch alle
CSS-Animationen, die sonst ab dem Einhängen ihrer Szene weiterlaufen würden. So
sind beide Enden der Aufnahme ruhig, und der Schnitt darf ein paar Frames daneben
liegen, ohne in eine Bewegung zu schneiden.

Vor der eigentlichen Aufnahme läuft ein vollständiger Durchgang als Vorlauf.
Danach liegen Clips, Bilder und Schriften in Chromiums Cache, sodass die beiden
Screencast-Szenen nicht mit einem Standbild beginnen.

Am Ende prüft das Skript die Datei mit ffprobe und meldet, wenn die Maschine
während der Aufnahme Bilder verloren hat.

## Die Szenenfolge

Sie steht in `src/data/showcaseSpot.ts`, die Texte in den i18n-Katalogen unter
`scenes.spot-*`. Sechs Szenen mit dem Dreiklang Messen, Verstehen, Handeln
dazwischen:

| Zeit      | Szene          | Bild                      |
| --------- | -------------- | ------------------------- |
| 0 – 5 s   | Problem        | Bewässerung von Hand      |
| 5 – 10 s  | 01 · Messen    | Sensoreinbau              |
| 10 – 16 s | 02 · Verstehen | Screencast Karte          |
| 16 – 22 s | 03 · Handeln   | Screencast Einsatzplanung |
| 22 – 26 s | Herkunft       | Team                      |
| 26 – 30 s | Schlusskarte   | Wortmarke und Adressen    |

Die beiden Screencast-Szenen sind kürzer als ihre Aufnahmen und springen über
`startAt` in den Clip hinein, weil die Aufnahmen mit einer ruhigen Anfahrt
beginnen. Ändert sich ein Clip, muss dieser Versatz mit. Ein Test wacht darüber,
dass der Ausschnitt innerhalb der Aufnahme bleibt, die Gesamtlänge exakt dreißig
Sekunden ergibt und beide Sprachen für jede Szene Texte haben.

Die erste Szene sollte kein Screencast sein: Das Anhalten friert Animationen ein,
ein Video im ersten Bild würde trotzdem weiterlaufen.
