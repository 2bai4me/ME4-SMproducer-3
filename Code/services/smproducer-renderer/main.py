#!/usr/bin/env python3
"""
ME4-SMproducer Renderer Service – Entry Point

CPU-intensive Aufgaben: Video-Encoding, TTS, Bildverarbeitung.
Kommuniziert mit der Pipeline via ZMQ REQ/REP.

Usage:
    python main.py
"""

import zmq
import logging

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(name)s %(levelname)s: %(message)s",
)
logger = logging.getLogger("smproducer-renderer")

ZMQ_PORT = 5555


def main() -> None:
    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind(f"tcp://*:{ZMQ_PORT}")

    logger.info(f"Renderer Service gestartet auf Port {ZMQ_PORT}")

    while True:
        message = socket.recv_json()
        logger.info(f"Job empfangen: {message.get('type', 'unknown')}")

        # TODO: Job-Verarbeitung (Video-Encoding, TTS, etc.)
        response = {"status": "ok", "message": "Job received"}
        socket.send_json(response)


if __name__ == "__main__":
    main()
