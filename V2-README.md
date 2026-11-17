# Battery Card v2 – Entwicklungsvorschau

> **Noch keine fertige HACS-Veröffentlichung.** Der Code liegt auf dem Branch feature/battery-card-v2-editor. Die ursprüngliche battery-card.js auf master bleibt unverändert.

## Funktionen
- Visueller Lovelace-Editor via getConfigElement() und config-changed
- Mehrere Geräte je Karte: hinzufügen, sortieren, entfernen
- Pro Gerät ein Batteriestandsensor und ein optionaler Ladezustandssensor
- Ladestatus automatisch (on/off, charging/discharging, 1/0) oder via konfigurierbarem Wert für „lädt“
- Liste oder Raster mit 1–4 Spalten
- Balken, MDI-Symbol oder kombinierte Batterieanzeige
- Frei wählbare Positionen für Gerätename, Bild, Prozentwert und Ladestatus in einem 3×3-Raster
- Einzelne Elemente ein-/ausblenden und Farbgrenzen einstellen

## Beispielkonfiguration

    type: custom:battery-card
    view: grid
    columns: 2
    layout: custom
    battery_style: both
    entities:
      - entity: sensor.iphone_battery_level
        name: iPhone
        charging_entity: sensor.iphone_battery_state
        charging_on_state: Charging
      - entity: sensor.tablet_battery_level
        name: Tablet
        charging_entity: binary_sensor.tablet_charging
      - entity: sensor.thermometer_battery
        name: Thermometer
    positions:
      name: top-center
      image: middle-left
      level: middle-right
      status: bottom-center
    low_threshold: 20
    warn_threshold: 50

## Testinstallation

Die Entwicklungsversion ist noch nicht als HACS-Update freigegeben.

1. Datei battery-card-v2.js aus dem Entwicklungsbranch herunterladen.
2. Unter /config/www/battery-card-v2.js in Home Assistant speichern.
3. In den Dashboard-Ressourcen die alte Battery-Card-JS-Ressource für den Test entfernen bzw. deaktivieren (nicht beide Versionen parallel laden: gleicher custom element type).
4. Als JavaScript-Modul die Ressource /local/battery-card-v2.js?v=2 hinzufügen.
5. Browser neu laden. Im Dashboard-Karteneditor die neue „Battery Card“ auswählen.

**Vorher Dashboard-Konfiguration sichern.** Andere Dashboards mit bestehenden Batterie-Karten beim Test kontrollieren. Beim Zurückwechseln die alten Ressourcen wiederherstellen und neu laden.

## Kompatibilität

Die bisherigen Schlüsselfelder entity, name und layout sind lesbar. Die bisherigen Base64-PNG-Batteriebilder wurden für diese Vorschau allerdings durch schlanke CSS-Balken / MDI-Icons ersetzt. Daher können sich Aussehen und Bild-Styling von älteren Karten ändern. styles.image betrifft nun nur den Container.

## Noch zu prüfen

- Echte Home-Assistant-Editorvorschau und Picker-Verhalten
- Mobile, Tablet, Desktop, helle und dunkle Themes
- Ladezustände unterschiedlicher Integrationen
- Optionaler Legacy-Bildstil
- Endgültige HACS-Dateiumstellung und Upgrade-Pfad

Die JavaScript-Syntax und Basisfälle mit mehreren Geräten, Ladezuständen, Legacy-Konfiguration und fehlenden Entitäten wurden in einem Mock-Test geprüft. Ein vollständiger Test im echten Home Assistant fehlt noch.
