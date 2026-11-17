# Battery Card v2 – Entwicklungsvorschau

> **Noch keine fertige HACS-Veröffentlichung.** Der Code liegt auf dem Branch feature/battery-card-v2-editor. Die ursprüngliche battery-card.js auf master bleibt unverändert.

## Funktionen
- Visueller Lovelace-Editor via getConfigElement() und config-changed
- Mehrere Geräte je Karte: hinzufügen, sortieren, entfernen
- Pro Gerät ein Batteriestandsensor und ein optionaler Ladezustandssensor
- Ladestatus automatisch (on/off, charging/discharging, 1/0) oder via konfigurierbarem Wert für „lädt“
- Liste oder Raster mit 1–4 Spalten
- Unveränderte originale Batterie-PNG-Grafiken (Standard), optional Balken, MDI-Symbol oder kombinierte Anzeige
- Frei wählbare Positionen für Gerätename, Bild, Prozentwert und Ladestatus in einem 3×3-Raster
- Einzelne Elemente ein-/ausblenden und Farbgrenzen einstellen

## Beispielkonfiguration

    type: custom:battery-card
    view: grid
    columns: 2
    layout: custom
    battery_style: original
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

Die bisherigen Schlüsselfelder entity, name und layout sind weiterhin lesbar. **Alle sieben originalen Base64-PNG-Batteriegrafiken wurden unverändert übernommen und sind die Standardanzeige** (battery_style: original). Die originalen Schwellen für die Bildauswahl bleiben ebenfalls erhalten. Die Grafikbreite lässt sich optional mit image_size (Pixel) festlegen. Bisherige styles.image-Objekte werden weiterhin ausgewertet; der alte size-Prozentwert bleibt als Skalierungsfaktor erhalten. Da die Layout-Engine neu ist, können Abstände und Positionen gegenüber der bisherigen Karte abweichen. CSS-Balken und MDI-Icons sind nur optionale Alternativen.

## Noch zu prüfen

- Echte Home-Assistant-Editorvorschau und Picker-Verhalten
- Mobile, Tablet, Desktop, helle und dunkle Themes
- Ladezustände unterschiedlicher Integrationen
- Darstellung der Originalgrafiken in Home Assistant auf verschiedenen Displaygrößen überprüfen
- Endgültige HACS-Dateiumstellung und Upgrade-Pfad

Die JavaScript-Syntax sowie Basisfälle mit mehreren Geräten, Ladezuständen, Legacy-Konfiguration und fehlenden Entitäten wurden in einem Mock-Test geprüft. Zusätzlich wurden alle sieben Grafikdaten bytegenau mit den Originalen verglichen und die bisherigen Schwellenwerte getestet. Ein vollständiger Test im echten Home Assistant fehlt noch.
