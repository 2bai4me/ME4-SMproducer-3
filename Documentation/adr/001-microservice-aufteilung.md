# ADR 001 – Microservice-Aufteilung: Pipeline vs. Renderer

**Status:** Akzeptiert  
**Datum:** 2026-05-04  
**Entscheider:** Manager (deepseek-v4-pro)

## Kontext

ME4-SMproducer 3.0 benötigt eine Architektur, die:
- CPU-intensive Video-Rendering-Aufgaben von der Web-API entkoppelt
- Unabhängige Skalierung erlaubt
- Unterschiedliche Technologie-Stacks pro Service ermöglicht (Node.js vs. Python)

## Entscheidung

Zwei getrennte Microservices:
1. **smproducer-pipeline** (Node.js/Express) – API, Job-Orchestrierung, Datenhaltung
2. **smproducer-renderer** (Python) – Video-Encoding, TTS, Bildverarbeitung

Kommunikation via ZMQ REQ/REP (synchrone Job-Verarbeitung).

## Alternativen

| Alternative | Pro | Contra |
|---|---|---|
| Monolith | Einfachere Entwicklung | Keine getrennte Skalierung, kein Polyglot |
| REST zwischen Services | Bekanntes Protokoll | Overhead bei großen Payloads, kein Backpressure |
| Redis Queue | Robust, persistent | Zusätzliche Infrastruktur-Abhängigkeit |

## Konsequenzen

- ✅ Pipeline bleibt responsiv während Rendering
- ✅ Python kann für Video/ML genutzt werden, Node für API
- ✅ Unabhängige Bereitstellung möglich
- ❌ ZMQ als zusätzliche Kommunikationsschicht
- ❌ Zwei Codebasen zu pflegen
