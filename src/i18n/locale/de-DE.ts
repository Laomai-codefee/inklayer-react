export default {
    common: {
        save: 'Speichern',
        export: 'Exportieren',
        author: 'Autor',
        type: 'Typ',
        loading: 'PDF wird geladen...',
        error: 'Laden fehlgeschlagen',
        success: 'Erfolgreich',
        default: 'Standard',
        custom: 'Benutzerdefiniert',
        upload: 'Hochladen',
        ok: 'OK',
        cancel: 'Abbrechen',
        clear: 'Löschen',
        selectAll: 'Alles auswählen',
        draw: 'Zeichnen',
        enter: 'Eingeben',
        confirm: 'Bestätigen',
        reply: 'Antworten',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        more: 'Mehr',
        color: 'Farbe',
        strokeWidth: 'Strichstärke',
        opacity: 'Deckkraft',
        transparent: 'Transparent',
        comment: 'Kommentar',
        fileSizeLimit: 'Die Dateigröße überschreitet das Limit von {{value}}',
        print: 'Drucken',
        dateFormat: {
            full: '{{day}}.{{month}}.{{year}} {{hour}}:{{minute}}',
            dayMonth: '{{day}}.{{month}}.',
            dayMonthYear: '{{day}}.{{month}}.{{year}}'
        }
    },

    viewer: {
        zoom: {
            auto: 'automatisch',
            actual: 'tatsächlich',
            fit: 'Seitengröße',
            width: 'Seitenbreite',
            zoomIn: 'Vergrößern',
            zoomOut: 'Verkleinern',
        },
        sidebar: {
            toggle: 'Seitenleiste umschalten'
        },
        search: {
            search: 'Suchen',
            placeholder: 'Dokument durchsuchen…',
            searching: 'Suche läuft...',
            page: 'Seite {{value}}',
            resultTotal: '{{total}} Ergebnisse gefunden',
            caseSensitive: 'Groß-/Kleinschreibung',
            entireWord: 'Ganzes Wort',
        }
    },

    annotator: {
        tool: {
            select: 'Auswählen',
            highlight: 'Hervorheben',
            strikeout: 'Durchstreichen',
            underline: 'Unterstreichen',
            rectangle: 'Rechteck',
            circle: 'Kreis',
            freehand: 'Freihand',
            freeHighlight: 'Freies Hervorheben',
            freeText: 'Text',
            signature: 'Unterschrift',
            stamp: 'Stempel',
            note: 'Notiz',
            arrow: 'Pfeil',
            cloud: 'Wolke'
        },
        sidebar: {
            toggle: 'Anmerkungen anzeigen'
        },
        common: {
            createStamp: 'Stempel erstellen',
            createSignature: 'Unterschrift erstellen',
            loadError: 'Laden der Anmerkungen fehlgeschlagen',
            errorCode: 'Fehlercode',
            unknownError: 'Unbekannter Fehler',
            loading: 'Anmerkungen werden geladen...',
            loadingHint: 'Das Laden der Anmerkungen dauert etwas länger, bitte warten...'
        },
        editor: {
            text: {
                startTyping: 'Tippen Sie hier…'
            },
            stamp: {
                stampText: 'Stempeltext',
                fontStyle: 'Schriftstil',
                fontFamily: 'Schriftart',
                textColor: 'Textfarbe',
                backgroundColor: 'Hintergrundfarbe',
                borderColor: 'Rahmenfarbe',
                borderStyle: 'Rahmenstil',
                timestampText: 'Zeitstempel-Text',
                customTimestamp: 'Benutzerdefinierter Text',
                username: 'Benutzername',
                date: 'Datum',
                time: 'Zeit',
                dateFormat: 'Datumsformat',
                solid: 'Durchgezogen',
                dashed: 'Gestrichelt',
                none: 'Keine',
                defaultText: 'Entwurf',
                defaultStampNotSet: 'Kein Standardstempel festgelegt',
                upload: 'Bild auswählen'
            },
            signature: {
                area: 'Unterschrift',
                upload: 'Bild',
                choose: 'Bild auswählen',
                uploadHint: '{{format}}, max. Größe {{maxSize}}'
            }
        },
        comment: {
            total: 'Kommentar {{value}}',
            page: 'Seite {{value}}',
            status: {
                accepted: 'Akzeptiert',
                rejected: 'Abgelehnt',
                cancelled: 'Abgebrochen',
                completed: 'Erledigt',
                none: 'Keine',
                closed: 'Geschlossen'
            },
            statusText: 'Status setzen: {{value}}',
            nativeAnnotation: 'Native Anmerkung'
        },
        export: {
            fields: {
                id: 'ID',
                page: 'Seite',
                author: 'Autor',
                date: 'Datum',
                content: 'Inhalt',
                status: 'Status',
                annotationType: 'Anmerkungstyp',
                recordType: 'Typ'
            },
            recordType: {
                annotation: 'Anmerkung',
                reply: 'Antwort'
            }
        }
    }
}
