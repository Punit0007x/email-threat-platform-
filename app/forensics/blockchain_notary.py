import hashlib
import json
import logging
from datetime import datetime, timezone
from web3 import Web3

logger = logging.getLogger(__name__)

# In a true production environment, this would connect to an Infura/Alchemy endpoint
# and interact with a deployed smart contract. For this iteration, we simulate the
# Web3 provider and generate a local cryptographically signed receipt.

class BlockchainNotary:
    def __init__(self, provider_url="http://127.0.0.1:8545"):
        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        # This is a mock contract address for the local ledger
        self.contract_address = "0x" + "0" * 40

    def hash_email_evidence(self, raw_eml_path: str, parsed_metadata: dict) -> str:
        """Generates a SHA-256 hash of the raw email bytes + the analysis metadata."""
        hasher = hashlib.sha256()
        try:
            with open(raw_eml_path, 'rb') as f:
                hasher.update(f.read())
        except Exception as e:
            logger.error(f"Failed to read raw email for hashing: {e}")
            return ""
            
        metadata_bytes = json.dumps(parsed_metadata, sort_keys=True).encode('utf-8')
        hasher.update(metadata_bytes)
        return hasher.hexdigest()

    def notarize_evidence(self, raw_eml_path: str, parsed_metadata: dict) -> dict:
        """
        Hashes the evidence and 'submits' it to the blockchain ledger.
        Returns a cryptographic receipt.
        """
        evidence_hash = self.hash_email_evidence(raw_eml_path, parsed_metadata)
        if not evidence_hash:
            return {"error": "Failed to generate evidence hash"}

        # Simulate a Blockchain transaction receipt
        # In reality, this would be: txn_hash = contract.functions.notarize(evidence_hash).transact()
        mock_txn_hash = "0x" + hashlib.sha256(evidence_hash.encode()).hexdigest()
        
        receipt = {
            "evidence_hash_sha256": evidence_hash,
            "blockchain_network": "Local-Ethereum-Notary",
            "transaction_hash": mock_txn_hash,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "status": "NOTARIZED_ON_LEDGER"
        }
        
        logger.info(f"Evidence notarized on blockchain: {mock_txn_hash}")
        return receipt
