import { promises as fs } from 'fs';
import path from 'path';

/**
 * Ensures that a directory exists.
 * Creates the directory if it doesn't exist.
 * @param dirPath The path of the directory to ensure exists
 * @throws Error if directory creation fails
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ensures that the docs/output directory exists.
 * Creates the directory if it doesn't exist.
 * @throws Error if directory creation fails
 */
export async function ensureOutputDirectory(): Promise<void> {
  const outputDir = path.join('docs', 'output');
  return ensureDirectory(outputDir);
}

/**
 * Writes content to a file with proper error handling.
 * @param filePath The path where the file should be written
 * @param content The content to write to the file
 * @throws Error if file writing fails
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}