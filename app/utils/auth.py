import hashlib

def hash_password(password):
    salt = hashlib.sha256().hexdigest()[:10]
    hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed_password}"

def verify_password(input_password, hashed_password):
    salt, stored_password = hashed_password.split("$")
    input_hashed_password = hashlib.sha256((input_password + salt).encode()).hexdigest()
    return input_hashed_password == stored_password