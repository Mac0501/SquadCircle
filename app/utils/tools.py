import secrets
import hashlib

def generate_random_hex(length: int = 16):
    # Generate a random sequence of bytes
    random_bytes = secrets.token_bytes(length)
    
    # Use hashlib to hash the bytes and get a hex representation
    hex_code = hashlib.sha256(random_bytes).hexdigest()
    
    # Trim the hex code to the desired length
    return hex_code[:length]