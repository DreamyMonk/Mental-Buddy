// src/app/api/chat/upload/route.ts

export const runtime = 'nodejs'; // Force Node.js runtime for file system access

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises'; // Combine fs imports
import path from 'path';
import { randomUUID } from 'crypto';

// Helper function to ensure directory exists
async function ensureDirExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: unknown) { // Use unknown
    // Check if error is an object with a 'code' property before accessing it
    if (typeof error === 'object' && error !== null && 'code' in error) {
        if ((error as { code: string }).code !== 'EEXIST') { // Ignore error if directory already exists
             throw error; // Re-throw other errors
        }
    } else {
        // Re-throw if it's not a recognizable error object
        throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // --- Basic Validation (Example) ---
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
         return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 }); // This return is now valid in Node.js runtime
    }
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
         return NextResponse.json({ error: `File size exceeds limit (${maxSize / 1024 / 1024}MB)` }, { status: 400 }); // This return is now valid
    }
    // --- End Validation ---

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Store the file ---
    // **WARNING:** Storing directly in `public` is simple for demo but NOT recommended for production.
    // Vercel's file system is ephemeral for serverless functions. Use dedicated storage (Vercel Blob, S3, etc.) for persistent uploads.
    // This local storage method will likely FAIL on subsequent serverless invocations on Vercel.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads'); // Path might not be writable/persistent on Vercel
    await ensureDirExists(uploadDir);

    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);
    console.log(`File allegedly uploaded to temporary path: ${filePath}`);

    // This publicPath might work temporarily if the serverless function persists, but it's unreliable.
    const publicPath = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ success: true, filePath: publicPath, fileName: file.name });

  } catch (error: unknown) { // Use unknown
    console.error("Upload error:", error);
    // Type check before accessing properties
    const message = error instanceof Error ? error.message : 'File upload failed';
    // Provide more specific error for filesystem issues often seen on serverless
    if (error instanceof Error && 'code' in error) {
         const code = (error as { code: string }).code;
         if (code === 'EACCES' || code === 'EROFS') {
            console.error("Filesystem permission error likely due to serverless environment.");
            return NextResponse.json({ error: 'Server filesystem error during upload. Persistent storage like Vercel Blob is recommended.' }, { status: 500 });
         }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}