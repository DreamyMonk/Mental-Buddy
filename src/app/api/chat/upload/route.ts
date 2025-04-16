// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto'; // For unique filenames

// Helper function to ensure directory exists
import { mkdir } from 'fs/promises';
async function ensureDirExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') { // Ignore error if directory already exists
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // ... (formData logic) ...
  } catch (error: unknown) { // <--- Change any to unknown
    console.error("Upload error:", error);
    // Type check before accessing properties
    const message = error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

    // --- Basic Validation (Example) ---
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
         return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
         return NextResponse.json({ error: `File size exceeds limit (${maxSize / 1024 / 1024}MB)` }, { status: 400 });
    }
    // --- End Validation ---


    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Store the file ---
    // **WARNING:** Storing directly in `public` is simple for demo but NOT recommended for production.
    // Files in `public` are publicly accessible. Consider dedicated storage (S3, GCS, etc.)
    // or a non-publicly served directory if privacy is needed.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await ensureDirExists(uploadDir); // Make sure the directory exists

    // Create a unique filename to avoid collisions
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);
    console.log(`File uploaded successfully to: ${filePath}`);

    // Return the path relative to the 'public' folder so it can be served
    const publicPath = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ success: true, filePath: publicPath, fileName: file.name });

  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}