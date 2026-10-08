# Kirby Consent

Einwilligung für externe Dienste in Kirby. Ohne Zustimmung bleibt ein Platzhalter, Skripte und iframes werden erst danach geladen.

## Installation

```bash
composer require dasformt/kirby-consent
```

Am Ende des öffentlichen Footers, nach den Skripten, die auf die Entscheidung warten:

```php
<?php snippet('consent') ?>
```

Die Entscheidung liegt in `localStorage`. Einstellungen erneut öffnen:

```html
<button type="button" data-consent-open-settings>Datenschutz-Einstellungen</button>
```

## Dienste

Kategorien in `site/config/config.php` unter `dasformt.consent`. Texte, Speicherkey und Asset-URLs sind projektspezifisch.

```php
'dasformt.consent.storageKey' => 'projekt-consent',
'dasformt.consent.version' => 1,
'dasformt.consent.categories' => [
    'maps' => [
        'label' => 'Karten',
        'description' => 'Karten werden von einem externen Dienst geladen.',
        'placeholder' => 'Ohne Einwilligung stellen wir keine Verbindung her.',
        'button' => 'Karte anzeigen',
        'assets' => [
            ['type' => 'style', 'href' => 'https://example.com/map.css'],
            ['type' => 'script', 'src' => 'https://example.com/map.js'],
        ],
    ],
],
```

Ein Dienst ohne `assets` wird nur eingeblendet. Dafür liegt das Markup in einem `<template>`.

## Gate

```html
<div data-consent-gate="maps"></div>
```

```html
<div data-consent-gate="media">
    <template><!-- iframe --></template>
</div>
```

`data-consent-title`, `data-consent-text` und `data-consent-button` überschreiben den Text der Kategorie.

Skripte starten nach `consentready` oder `consentchange` und prüfen `dasformtConsent.has('maps')`. Der Platzhalter `.consent-placeholder` muss weg sein, bevor der Dienst in denselben Container schreibt.

API: `get`, `has`, `grant`, `acceptAll`, `denyOptional`, `openSettings`.

Farben über `--consent-accent`, `--consent-text`, `--consent-surface`, `--consent-placeholder`.

## Lizenz

MIT
