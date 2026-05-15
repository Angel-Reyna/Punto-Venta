type ApiErrorLike = {
  response?: {
    data?: unknown;
    status?: number;
  };
  message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessageFromData(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (!isRecord(data)) {
    return null;
  }

  const message = data.message;

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  const error = data.error;

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  const errors = data.errors;

  if (Array.isArray(errors)) {
    const firstMessage = errors.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );

    if (firstMessage) {
      return firstMessage.trim();
    }

    const firstObjectMessage = errors.find(
      (item): item is Record<string, unknown> =>
        isRecord(item) &&
        typeof item.message === "string" &&
        item.message.trim().length > 0
    );

    if (firstObjectMessage && typeof firstObjectMessage.message === "string") {
      return firstObjectMessage.message.trim();
    }
  }

  return null;
}

function getStatusMessage(status?: number): string | null {
  switch (status) {
    case 400:
      return "La solicitud contiene datos inválidos.";
    case 401:
      return "Tu sesión expiró. Inicia sesión nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "No se encontró el recurso solicitado.";
    case 409:
      return "La operación no se puede completar por un conflicto de datos.";
    case 413:
      return "El archivo o contenido enviado es demasiado grande.";
    case 429:
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    case 500:
      return "Ocurrió un error interno. Intenta de nuevo más tarde.";
    default:
      return null;
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "No se pudo completar la operación. Intenta de nuevo."
): string {
  if (!isRecord(error)) {
    return fallback;
  }

  const apiError = error as ApiErrorLike;

  const dataMessage = extractMessageFromData(apiError.response?.data);

  if (dataMessage) {
    return dataMessage;
  }

  const statusMessage = getStatusMessage(apiError.response?.status);

  if (statusMessage) {
    return statusMessage;
  }

  if (typeof apiError.message === "string" && apiError.message.trim()) {
    return apiError.message.trim();
  }

  return fallback;
}
