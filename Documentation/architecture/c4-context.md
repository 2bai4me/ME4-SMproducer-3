# C4 Context – ME4-SMproducer 3.0

## Systemkontext

```mermaid
C4Context
    title System Context – ME4-SMproducer 3.0

    Person(user, "Content Creator", "Erstellt Social-Media-Videos über die Pipeline")
    
    System(smproducer, "ME4-SMproducer", "Automatisierte Video-Produktionspipeline")
    
    System_Ext(youtube, "YouTube", "Video-Quelle & Zielplattform")
    System_Ext(github, "GitHub", "Code- & Asset-Repository")
    System_Ext(tts_service, "Edge-TTS", "Sprachsynthese-Dienst")
    
    Rel(user, smproducer, "Definiert Produktionsparameter, Prüft Ergebnisse")
    Rel(smproducer, youtube, "Lädt Quellvideos herunter, Publiziert fertige Videos")
    Rel(smproducer, tts_service, "Generiert Sprachausgaben")
```

## Systemverantwortung

| System | Verantwortung |
|---|---|
| ME4-SMproducer | End-to-End Videoerstellung: Recherche → Script → TTS → Rendering |
| YouTube | Quellmaterial & Veröffentlichung |
| Edge-TTS | Sprachsynthese für Voiceover |
