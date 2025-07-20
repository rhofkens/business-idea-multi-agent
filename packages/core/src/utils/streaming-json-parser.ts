import { BusinessIdea, businessIdeaSchema } from '@business-idea/shared';

/**
 * Parses complete business idea objects from a streaming text buffer.
 * This function is designed to be stateless and find all valid objects
 * in the provided buffer.
 *
 * @param buffer The string buffer containing the streamed text.
 * @returns An object containing the list of newly parsed ideas and the
 *          remaining, unparsed portion of the buffer.
 */
export function parseCompleteIdeasFromBuffer(
  buffer: string,
): { newIdeas: BusinessIdea[]; newBuffer: string } {
  const newIdeas: BusinessIdea[] = [];
  let workBuffer = buffer;

  // Clean up the start of the buffer to find the beginning of our array
  const arrayStartIndex = workBuffer.indexOf('[');
  if (arrayStartIndex === -1) {
    // If no array has started, we can't parse anything yet.
    return { newIdeas, newBuffer: buffer };
  }
  workBuffer = workBuffer.substring(arrayStartIndex + 1); // Start from after the '['

  let cursor = 0;
  while (true) {
    const objectStartIndex = workBuffer.indexOf('{', cursor);
    if (objectStartIndex === -1) {
      // No more object starts found in the remainder of the buffer
      break;
    }

    let braceCount = 0;
    let inString = false;
    let objectEndIndex = -1;

    // Scan for the matching closing brace, respecting strings
    for (let i = objectStartIndex; i < workBuffer.length; i++) {
      const char = workBuffer[i];
      if (char === '"' && (i === 0 || workBuffer[i - 1] !== '\\')) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
      }

      if (!inString && braceCount === 0 && i >= objectStartIndex) {
        objectEndIndex = i;
        break; // Found the end of a complete object
      }
    }

    if (objectEndIndex !== -1) {
      // A complete object seems to be found
      const objectStr = workBuffer.substring(objectStartIndex, objectEndIndex + 1);
      try {
        const rawIdea = JSON.parse(objectStr);
        const validation = businessIdeaSchema.safeParse(rawIdea);
        if (validation.success) {
          newIdeas.push(validation.data as BusinessIdea);
        }
        // Whether it's valid or not, we move past it.
        cursor = objectEndIndex + 1;
      } catch (_e) {
        // Incomplete JSON, break the loop and wait for more chunks
        break;
      }
    } else {
      // No complete object found from the current cursor position, wait for more data
      break;
    }
  }

  // The new buffer is whatever was left after the last successfully parsed object
  const newBuffer = workBuffer.substring(cursor);
  // We need to prepend the '[' we stripped out, in case the JSON is not yet complete.
  return { newIdeas, newBuffer: '[' + newBuffer };
}