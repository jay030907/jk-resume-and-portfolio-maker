export async function fetchJsonSafe<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const rawText = await res.text();

  let parsed: (T & { error?: string }) | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as T & { error?: string };
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    if (parsed?.error) {
      throw new Error(parsed.error);
    }
    if (res.status === 404) {
      throw new Error('Requested API route was not found on this deployment.');
    }
    throw new Error(
      rawText && rawText.length < 180
        ? rawText
        : `Request failed with status ${res.status}. Please try again.`
    );
  }

  if (!parsed) {
    throw new Error('Received a non-JSON response from the server.');
  }

  return parsed;
}
