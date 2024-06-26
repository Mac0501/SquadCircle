import secrets
import hashlib
from typing import Dict, Any, Union, List
from app.db import models
from app.utils.exeptions import MissingBodyArgument

def generate_random_hex(length: int = 16):
    # Generate a random sequence of bytes
    random_bytes = secrets.token_bytes(length)
    
    # Use hashlib to hash the bytes and get a hex representation
    hex_code = hashlib.sha256(random_bytes).hexdigest()
    
    # Trim the hex code to the desired length
    return hex_code[:length]


async def resolve_model(variable: str, value: int) -> Union[int, Any]:
    model = None
    model_class = None
    for name, obj in models.__dict__.items():
        if hasattr(obj, '__parse_name__') and getattr(obj, '__parse_name__') == variable:
            model_class = obj
            break
    if model_class:
        model = await model_class.get_or_none(id=value)
        return model
    else:
        return value

async def process_match(match_data: Dict[str, Any]) -> Dict[str, Any]:
    processed_data = {}
    for key, value in match_data.items():
        if isinstance(value, int):
            variable = key[:-3]  # Removing '_id' from the key to get the variable name
            resolved_value = await resolve_model(variable, value) if key.endswith('_id') else value
            if isinstance(resolved_value, int):
                processed_data[key] = resolved_value
            else:
                processed_data[variable] = resolved_value
        else:
            processed_data[key] = value
    return processed_data

def filter_dict_by_keys(input_dict:Dict[str,Any], key_list:List[str], check_if_one_key_matches:bool = False):
    filtered_dict = {}
    if input_dict:
        for key in key_list:
            if key in input_dict:
                filtered_dict[key] = input_dict[key]
    if check_if_one_key_matches and filtered_dict == {}:
        raise MissingBodyArgument()
    return filtered_dict