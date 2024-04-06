from sanic.exceptions import SanicException

class MissingBodyArgument(SanicException):
    status_code = 400

    def __init__(self, message="Required argument(s) missing in the request body.", **kwargs):
        super().__init__(message, **kwargs)