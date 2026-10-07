# Lisas Dashboard

Ein persönliches Dashboard in dunklen, warmen Farben mit lila Akzenten.

## Bereiche

- Uni
- Persönliches
- Familie

Jeder Bereich enthält Aufgaben, Notizen, wichtige Links und Personen. Ein gemeinsamer Wochenkalender zeigt Termine und Geburtstage; im Uni-Bereich können wöchentliche Veranstaltungen mit Semesterzeitraum hinzugefügt werden. Stundenplan-Ausfälle und abwechselnde Wochen sind noch nicht enthalten. Einträge werden lokal im Browser gespeichert. Sie werden nicht auf GitHub hochgeladen und nicht automatisch zwischen Geräten geteilt. Auf gemeinsam verwendeten Geräten können andere Personen mit demselben Browserprofil die Einträge sehen.

Bestehende Einträge und ältere Sicherungen sind mit dieser Version weiterhin lesbar. Ein Geburtstag am 29. Februar wird nur in Schaltjahren angezeigt. Personen sind Kontakte und erhalten keinen Zugang zum Dashboard.

Über „Sicherung herunterladen“ lassen sich alle Einträge als JSON-Datei sichern. „Sicherung laden“ ersetzt die aktuellen Einträge nach einer Bestätigung. Browserdaten löschen entfernt auch die lokalen Einträge. Lokale Vorschau und veröffentlichte Website haben getrennte Speicher.

## Dateien

- `index.html`: Struktur und Inhalte
- `style.css`: Farben und Layout
- `script.js`: Funktionen und lokale Speicherung
- `assistant.js`: Bedienhilfe, KI-Verbindung und bestätigte Änderungsvorschläge

## Veröffentlichung mit GitHub Pages

Die vier Website-Dateien im Hauptverzeichnis des Repositorys auf `main` speichern. In Settings → Pages unter Source „Deploy from a branch“ wählen, Branch `main` und Ordner `/ (root)` einstellen und speichern. Es ist kein eigener Workflow erforderlich.

## Änderungen speichern

Ein Commit ist eine gespeicherte Version der Dateien mit einer kurzen Beschreibung. Änderungen auf `main` werden nach Aktivierung von Pages automatisch veröffentlicht.

## Assistent

Am Computer steht rechts eine Assistentenfläche, auf kleineren Bildschirmen unter dem Dashboard. Die Bedienhilfe funktioniert sofort. Echte KI-Antworten benötigen den separat vorbereiteten Assistentendienst und einen API-Zugang. Bei aktiver Verbindung werden nach Einwilligung Chat und Dashboard-Inhalte beim Senden an den Dienst und OpenAI übertragen. Änderungen werden erst nach Bestätigung gespeichert. Der Assistent kann Aufgaben, Notizen, Links, Termine, Veranstaltungen und Kontakte bearbeiten sowie Ansichten öffnen und Sicherungen herunterladen. GitHub-Dateien und fremde Anwendungen kann er nicht bearbeiten.

Diese Version enthält noch keine Spracheingabe und kein Offline-Caching. Die lokale Syntax und Funktionslogik wurden geprüft; Live-KI und Darstellung müssen nach Aktivierung zusätzlich geprüft werden.

## Mac-App

In Safari ab macOS Sonoma: Ablage → Zum Dock hinzufügen. Browser und Web-App haben getrennte Daten. Eine Dashboard-Sicherung herunterladen und in der Web-App laden.
