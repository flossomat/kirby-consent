<?php

use Kirby\Cms\Response;
use Kirby\Filesystem\F;

Kirby::plugin('dasformt/consent', [
    'options' => [
        'storageKey' => 'dasformt-consent',
        'version' => 1,
        'title' => 'Datenschutz',
        'text' => 'Einige Inhalte stammen von externen Diensten. Ohne Einwilligung bleiben sie deaktiviert.',
        'privacyUrl' => '',
        'privacyLabel' => 'Datenschutz',
        'settingsLabel' => 'Datenschutz-Einstellungen',
        'labels' => [
            'acceptAll' => 'Alle akzeptieren',
            'necessary' => 'Nur notwendige',
            'settings' => 'Einstellungen',
            'save' => 'Auswahl speichern',
            'back' => 'Zurück',
            'necessaryTitle' => 'Notwendig',
            'necessaryText' => 'Speichert Ihre Entscheidung lokal auf diesem Gerät. Immer aktiv.',
            'settingsTitle' => 'Einstellungen',
        ],
        'categories' => [],
    ],
    'snippets' => [
        'consent' => __DIR__ . '/snippets/consent.php',
    ],
    'routes' => [
        [
            'pattern' => 'consent/consent.css',
            'method' => 'GET|HEAD',
            'action' => function () {
                $file = __DIR__ . '/assets/consent.css';

                if (!is_file($file)) {
                    return false;
                }

                return new Response(F::read($file), 'text/css');
            },
        ],
        [
            'pattern' => 'consent/consent.js',
            'method' => 'GET|HEAD',
            'action' => function () {
                $file = __DIR__ . '/assets/consent.js';

                if (!is_file($file)) {
                    return false;
                }

                return new Response(F::read($file), 'application/javascript');
            },
        ],
    ],
]);
