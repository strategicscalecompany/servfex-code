import { apiClient } from './client';

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

const uploadToCloudinaryDirect = async (dataUri: string, folder: string): Promise<string> => {
  const signRes = await apiClient.post<{ success: boolean; data: CloudinarySignature }>(
    '/admin/upload/signature',
    { folder }
  );
  const signed = signRes.data?.data;
  if (!signed?.cloudName || !signed.signature) {
    throw new Error('Upload signature was not returned by the API');
  }

  const file = await (await fetch(dataUri)).blob();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('folder', signed.folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  const payload = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || 'Cloudinary did not return a hosted file URL');
  }
  return payload.secure_url as string;
};

/**
 * Host a data-URI on Cloudinary. Already-hosted http(s) URLs pass through.
 * Files go directly to Cloudinary so nginx/Vite never see the binary and CORS
 * is handled by Cloudinary, not api.servfex.com.
 */
export async function hostMediaIfNeeded(
  value: string | null | undefined,
  folder: string
): Promise<string | undefined> {
  if (!value) {
    return undefined;
  }
  if (!value.startsWith('data:')) {
    return value;
  }

  return uploadToCloudinaryDirect(value, folder);
}

export async function hostMediaList(
  values: Array<string | null | undefined>,
  folder: string
): Promise<string[]> {
  const hosted = await Promise.all(values.map((value) => hostMediaIfNeeded(value, folder)));
  return hosted.filter((url): url is string => Boolean(url));
}
