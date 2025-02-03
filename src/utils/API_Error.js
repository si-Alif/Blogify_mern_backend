
class API_ERROR extends Error {

  constructor(
      message = "Something went wrong",
      statusCode = 500,
      {
          errors = [],
          errorCode = "api_error",
          path = "",
          validationErrors = [],
          data = null,
          stack = "",
          cause = undefined,
      } = {}
  ) {
      super(message, { cause });


      this.statusCode = Number(statusCode) || 500;

      this.status = this.statusCode >= 400 && this.statusCode < 500 ? "Client Side failure" : "Server side error";

      this.errorCode = errorCode;
      this.errors = errors;
      this.validationErrors = validationErrors;
      this.path = path;
      this.data = null;
      this.success = false;
      this.timestamp = new Date().toISOString();

      if (stack) {
          this.stack = stack;
      } else {
          Error.captureStackTrace(this, this.constructor);
      }
  }


  toJSON() {
      return {
          success: this.success,
          status: this.status,
          statusCode: this.statusCode,
          errorCode: this.errorCode,
          message: this.message,
          path: this.path,
          timestamp: this.timestamp,
          errors: this.errors,
          validationErrors: this.validationErrors,
          ...(this.data && { data: this.data }),
          ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
      };
  }


  toLogString() {
      return `[${this.timestamp}] ${this.statusCode} ${this.errorCode}: ${this.message}
Path: ${this.path}
Stack: ${this.stack}
${this.validationErrors.length ? `Validation Errors: ${JSON.stringify(this.validationErrors)}` : ""}
${this.errors.length ? `Errors: ${JSON.stringify(this.errors)}` : ""}`;
  }
}

export { API_ERROR };