import json
import logging
import os
import time
from confluent_kafka import Consumer, KafkaError

logger = logging.getLogger(__name__)

class ScamBaitingAgent:
    """
    Active Defense Module: Listens to the Kafka event bus for high-confidence 
    phishing or BEC emails, and autonomously engages the threat actor using an LLM 
    to exhaust their resources and drop tracking pixels.
    """
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.group_id = "scambaiter-service-group"
        
        try:
            self.consumer = Consumer({
                'bootstrap.servers': self.bootstrap_servers,
                'group.id': self.group_id,
                'auto.offset.reset': 'earliest'
            })
            self.consumer.subscribe(['email-ingestion-events'])
            logger.info("ScamBaiter Service subscribed to Kafka topic 'email-ingestion-events'")
        except Exception as e:
            logger.error(f"Failed to initialize ScamBaiter Kafka Consumer: {e}")
            self.consumer = None

    def generate_deceptive_reply(self, email_data: dict) -> str:
        """
        Uses an LLM (mocked here for speed) to generate a highly credible, 
        confused, or compliant response to the attacker to waste their time.
        """
        subject = email_data.get('subject', 'Re: Your request')
        if "invoice" in subject.lower() or "payment" in subject.lower():
            return "Hi, I am trying to process this invoice but our accounting portal says the routing number is invalid. Can you provide an alternative SWIFT code or a PDF with the updated bank details? - Sent from my iPhone"
        elif "password" in subject.lower() or "account" in subject.lower():
            return "Hello, I clicked the link but it says 'Session Expired'. I really need to get this resolved today before I fly out. Is there a direct link you can send me? Thanks."
        else:
            return "I received this but the attachment seems corrupted on my Mac. Could you resend it in a different format?"

    def engage_attacker(self, email_id: str, email_data: dict):
        """
        Executes the counter-engagement.
        """
        fraud_score = email_data.get("fraud_assessment", {}).get("final_score", 0)
        
        # Only engage if we are highly confident it's a manual fraud attempt (BEC/Phishing)
        if fraud_score >= 85:
            reply_text = self.generate_deceptive_reply(email_data)
            attacker_email = email_data.get("reply_to") or email_data.get("from_address")
            
            logger.warning(f"🎯 [ACTIVE DEFENSE TRIGGERED] Engaging attacker for Case {email_id}")
            logger.warning(f"Target: {attacker_email}")
            logger.warning(f"Payload: {reply_text}")
            
            # Here we would use smtplib or an API like SendGrid to actually send the email.
            # We would also inject a transparent 1x1 tracking pixel linked back to our server
            # e.g., <img src="https://our-intel-server.com/track/UUID.png" />
            logger.info("Deceptive email dispatched with tracking pixel.")
        else:
            logger.debug(f"Email {email_id} score {fraud_score} below engagement threshold.")

    def run_forever(self):
        """Main event loop for the microservice."""
        if not self.consumer:
            logger.error("No consumer configured. Exiting ScamBaiter.")
            return

        logger.info("ScamBaiter Event Loop Started...")
        try:
            while True:
                msg = self.consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(msg.error())
                        break

                try:
                    payload = json.loads(msg.value().decode('utf-8'))
                    if payload.get("event") == "EMAIL_INGESTED":
                        email_id = payload.get("email_id")
                        email_data = payload.get("data", {})
                        self.engage_attacker(email_id, email_data)
                except Exception as e:
                    logger.error(f"Error processing Kafka message: {e}")
                    
        except KeyboardInterrupt:
            pass
        finally:
            self.consumer.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    service = ScamBaitingAgent()
    service.run_forever()
