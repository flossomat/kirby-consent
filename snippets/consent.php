<?php

$pluginRoot = dirname(__DIR__);
$cssVersion = @filemtime($pluginRoot . '/assets/consent.css');
$jsVersion = @filemtime($pluginRoot . '/assets/consent.js');

$labels = option('dasformt.consent.labels', []);
$categories = option('dasformt.consent.categories', []);
$privacyUrl = (string)option('dasformt.consent.privacyUrl', '');

if ($privacyUrl === '' && ($privacyPage = page('datenschutz'))) {
    $privacyUrl = $privacyPage->url();
}

$clientCategories = [];

foreach ($categories as $id => $category) {
    if (!is_string($id) || !preg_match('/^[a-z0-9_-]+$/', $id) || !is_array($category)) {
        continue;
    }

    $clientCategories[$id] = [
        'label' => (string)($category['label'] ?? $id),
        'description' => (string)($category['description'] ?? ''),
        'placeholder' => (string)($category['placeholder'] ?? ''),
        'button' => (string)($category['button'] ?? 'Einwilligen'),
        'assets' => array_values($category['assets'] ?? []),
    ];
}

$position = strtolower((string)option('dasformt.consent.position', 'left'));

if (!in_array($position, ['left', 'center', 'right'], true)) {
    $position = 'left';
}

$config = [
    'storageKey' => (string)option('dasformt.consent.storageKey', 'dasformt-consent'),
    'version' => (int)option('dasformt.consent.version', 1),
    'categories' => $clientCategories,
];
?>
<link rel="stylesheet" href="<?= url('consent/consent.css') ?>?v=<?= $cssVersion ?>">

<div class="consent" id="consent" hidden>
    <div
        class="consent-banner consent-banner--<?= esc($position) ?>"
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-text"
    >
        <div class="consent-banner-copy">
            <p class="consent-title" id="consent-title"><?= esc(option('dasformt.consent.title', 'Datenschutz')) ?></p>
            <p class="consent-text" id="consent-text"><?= esc(option('dasformt.consent.text', '')) ?></p>
            <?php if ($privacyUrl !== ''): ?>
                <a class="consent-privacy" href="<?= esc($privacyUrl) ?>"><?= esc(option('dasformt.consent.privacyLabel', 'Datenschutz')) ?></a>
            <?php endif ?>
        </div>
        <div class="consent-actions">
            <button type="button" class="consent-button" data-consent-action="necessary"><?= esc($labels['necessary'] ?? 'Nur notwendige') ?></button>
            <button type="button" class="consent-button" data-consent-action="settings"><?= esc($labels['settings'] ?? 'Einstellungen') ?></button>
            <button type="button" class="consent-button is-primary" data-consent-action="all"><?= esc($labels['acceptAll'] ?? 'Alle akzeptieren') ?></button>
        </div>
    </div>

    <div
        class="consent-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-settings-title"
        hidden
    >
        <button type="button" class="consent-settings-backdrop" data-consent-action="close-settings" aria-label="<?= esc($labels['back'] ?? 'Zurück') ?>"></button>
        <div class="consent-settings-panel">
            <p class="consent-title" id="consent-settings-title"><?= esc($labels['settingsTitle'] ?? 'Einstellungen') ?></p>
            <ul class="consent-categories">
                <li class="consent-category">
                    <label class="consent-category-label" for="consent-necessary">
                        <span>
                            <span class="consent-category-name"><?= esc($labels['necessaryTitle'] ?? 'Notwendig') ?></span>
                            <span class="consent-category-description"><?= esc($labels['necessaryText'] ?? '') ?></span>
                        </span>
                    </label>
                    <input id="consent-necessary" type="checkbox" checked disabled>
                </li>
                <?php foreach ($clientCategories as $id => $category): ?>
                    <li class="consent-category">
                        <label class="consent-category-label" for="consent-cat-<?= esc($id) ?>">
                            <span>
                                <span class="consent-category-name"><?= esc($category['label']) ?></span>
                                <?php if ($category['description'] !== ''): ?>
                                    <span class="consent-category-description"><?= esc($category['description']) ?></span>
                                <?php endif ?>
                            </span>
                        </label>
                        <input id="consent-cat-<?= esc($id) ?>" type="checkbox" data-consent-category="<?= esc($id) ?>">
                    </li>
                <?php endforeach ?>
            </ul>
            <div class="consent-actions">
                <button type="button" class="consent-button" data-consent-action="close-settings"><?= esc($labels['back'] ?? 'Zurück') ?></button>
                <button type="button" class="consent-button is-primary" data-consent-action="save"><?= esc($labels['save'] ?? 'Auswahl speichern') ?></button>
            </div>
        </div>
    </div>
</div>

<script type="application/json" id="consent-config"><?= json_encode($config, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
<script src="<?= url('consent/consent.js') ?>?v=<?= $jsVersion ?>"></script>
