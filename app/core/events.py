import json
import logging
import os
from confluent_kafka import Producer

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.producer = None
        
        try:
            self.producer = Producer({
                'bootstrap.servers': self.bootstrap_servers,
                'client.id': 'fastapi-orchestrator'
            })
            logger.info(f"Connected to Kafka at {self.bootstrap_servers}")
        except Exception as e:
            logger.warning(f"Kafka not available: {e}. Running in standalone mode.")

    def publish_email_ingested(self, email_id: str, email_data: dict):
        """
        Publishes the parsed email to Kafka so other microservices 
        (e.g., Sandbox Detonator, GNN Attribution) can process it asynchronously.
        """
        if not self.producer:
            return
            
        topic = "email-ingestion-events"
        try:
            payload = json.dumps({
                "event": "EMAIL_INGESTED",
                "email_id": email_id,
                "data": email_data
            }).encode('utf-8')
            
            self.producer.produce(topic, key=str(email_id).encode('utf-8'), value=payload)
            self.producer.poll(0) # Trigger delivery callbacks
            logger.info(f"Published email {email_id} to Kafka topic {topic}")
        except Exception as e:
            logger.error(f"Failed to publish to Kafka: {e}")

    def flush(self):
        if self.producer:
            self.producer.flush()

# Singleton for the API
event_bus = EventBus()
